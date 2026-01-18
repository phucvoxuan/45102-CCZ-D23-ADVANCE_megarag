'use client';

import { CreditCard, Calendar, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS, type PlanName } from '@/lib/stripe/config';
import Link from 'next/link';

interface CurrentPlanProps {
  planName: PlanName;
  status: string;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  onManageSubscription: () => void;
  isLoading?: boolean;
}

export function CurrentPlan({
  planName,
  status,
  billingCycle,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  onManageSubscription,
  isLoading = false,
}: CurrentPlanProps) {
  const plan = PLANS[planName];
  const isPaid = planName !== 'FREE';
  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.price;

  const getStatusBadge = () => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Canceling</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-700">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              ${billingCycle === 'yearly' ? Math.round(price / 12) : price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            {billingCycle === 'yearly' && isPaid && (
              <p className="text-sm text-muted-foreground">Billed ${price}/year</p>
            )}
          </div>
        </div>

        {/* Cancellation Warning */}
        {cancelAtPeriodEnd && currentPeriodEnd && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Subscription Ending</p>
              <p className="text-sm text-yellow-700">
                Your subscription will end on {formatDate(currentPeriodEnd)}.
                You can resubscribe at any time.
              </p>
            </div>
          </div>
        )}

        {/* Billing Details */}
        {isPaid && currentPeriodEnd && !cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Next billing date: {formatDate(currentPeriodEnd)}</span>
          </div>
        )}

        {/* Features */}
        <div>
          <h4 className="font-medium mb-2">Included Features</h4>
          <ul className="grid grid-cols-2 gap-2">
            {plan.features.slice(0, 6).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {isPaid ? (
            <Button onClick={onManageSubscription} disabled={isLoading}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {isLoading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          ) : (
            <Button asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          )}

          <Button variant="outline" asChild>
            <Link href="/pricing">
              {isPaid ? 'Change Plan' : 'View All Plans'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
