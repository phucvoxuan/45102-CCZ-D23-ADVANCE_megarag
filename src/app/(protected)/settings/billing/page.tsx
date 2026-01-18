'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrentPlan } from '@/components/billing/CurrentPlan';
import { UsageOverview } from '@/components/billing/UsageOverview';
import { BillingHistory } from '@/components/billing/BillingHistory';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToCustomerPortal } from '@/lib/stripe/client';
import type { Subscription, Invoice, PlanName, BillingCycle } from '@/types/database';
import Link from 'next/link';

interface MediaUsageData {
  used: number;
  limit: number;
  remaining: number;
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
  percentage: number;
}

interface BillingData {
  subscription: Subscription | null;
  usage: {
    documents: number;
    pages: number;
    queries: number;
    storage: number;
  };
  mediaUsage?: {
    audioUsage: MediaUsageData;
    videoUsage: MediaUsageData;
  };
  invoices: Invoice[];
}

export default function BillingSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings/billing');
      return;
    }

    if (user) {
      fetchBillingData();
    }
  }, [user, authLoading, router]);

  async function fetchBillingData() {
    try {
      const response = await fetch('/api/billing');
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      const billingData = await response.json();
      setData(billingData);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      // Set default data if API doesn't exist yet
      setData({
        subscription: null,
        usage: {
          documents: 0,
          pages: 0,
          queries: 0,
          storage: 0,
        },
        invoices: [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      await redirectToCustomerPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
      setPortalLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine current plan info
  const planName: PlanName = (data?.subscription?.plan_name as PlanName) || 'FREE';
  const status = data?.subscription?.status || 'active';
  const billingCycle: BillingCycle = (data?.subscription?.billing_cycle as BillingCycle) || 'monthly';
  const currentPeriodEnd = data?.subscription?.current_period_end || null;
  const cancelAtPeriodEnd = data?.subscription?.cancel_at_period_end || false;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view usage, and download invoices
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Current Plan */}
        <CurrentPlan
          planName={planName}
          status={status}
          billingCycle={billingCycle}
          currentPeriodEnd={currentPeriodEnd}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          onManageSubscription={handleManageSubscription}
          isLoading={portalLoading}
        />

        {/* Usage Overview */}
        <UsageOverview
          planName={planName}
          usage={data?.usage || { documents: 0, pages: 0, queries: 0, storage: 0 }}
          mediaUsage={data?.mediaUsage}
        />

        {/* Billing History */}
        <BillingHistory
          invoices={data?.invoices || []}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
