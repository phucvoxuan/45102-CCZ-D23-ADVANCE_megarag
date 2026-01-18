'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, FileText, MessageSquare, HardDrive, Crown, ArrowUpRight, Calendar, AlertTriangle, File, RefreshCw, Music, Video, AlertCircle, Bot } from 'lucide-react';
import Link from 'next/link';
import { PLANS, type PlanName, formatStorage } from '@/lib/stripe/config';
import { useTranslation } from '@/i18n';

interface MediaUsageData {
  used: number;
  limit: number;
  remaining: number;
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
  percentage: number;
}

interface WidgetData {
  id: string;
  name: string;
  total_messages: number;
  total_conversations: number;
}

interface WidgetUsageData {
  used: number;
  limit: number;
  totalQueries: number;
  widgets: WidgetData[];
}

interface UsageData {
  plan: PlanName;
  documents: { used: number; limit: number };
  pages: { used: number; limit: number };
  queries: { used: number; limit: number };
  storage: { used: number; limit: number };
  periodEnd: string;
  periodStart: string;
  price: number;
  billingCycle: string;
  status: string;
  daysRemaining: number;
  availableQueryModes: string[];
  mediaUsage?: {
    audioUsage: MediaUsageData;
    videoUsage: MediaUsageData;
  };
  widgetUsage?: WidgetUsageData;
}

// Default FREE plan usage data
const getDefaultUsage = (planName: PlanName = 'FREE'): UsageData => {
  const plan = PLANS[planName] || PLANS.FREE;
  return {
    plan: planName,
    documents: { used: 0, limit: plan.limits.documents },
    pages: { used: 0, limit: plan.limits.pages },
    queries: { used: 0, limit: plan.limits.queries },
    storage: { used: 0, limit: plan.limits.storage },
    periodStart: new Date().toISOString(),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    daysRemaining: 30,
    price: plan.price,
    billingCycle: 'monthly',
    status: 'active',
    availableQueryModes: planName === 'FREE' ? ['naive'] : ['naive', 'local', 'global', 'hybrid', 'mix'],
  };
};

export default function BillingPage() {
  const { user, subscription, isLoading: authLoading } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const fetchUsage = useCallback(async () => {
    if (!user) {
      console.log('[Billing] No user, setting default usage');
      setUsage(getDefaultUsage());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[Billing] Fetching usage for user:', user.id);

      // Fetch API data and subscription details in parallel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const supabase = createClient();

      const [response, subscriptionResult] = await Promise.all([
        fetch('/api/usage', { signal: controller.signal }),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage');
      }

      const data = result.data;
      const subscriptionData = subscriptionResult.data;
      const planName = (data.planName?.toUpperCase() || 'FREE') as PlanName;
      // Use billing cycle from API (which has validation logic for yearly plans)
      const billingCycle = data.billingCycle || subscriptionData?.billing_cycle || 'monthly';

      // Get correct price based on billing cycle
      const plan = PLANS[planName];
      const price = billingCycle === 'yearly' ? (plan?.priceYearly || 0) : (plan?.price || 0);

      setUsage({
        plan: planName,
        documents: { used: data.documents.current, limit: data.documents.limit },
        pages: { used: data.pages.current, limit: data.pages.limit },
        queries: { used: data.queries.current, limit: data.queries.limit },
        storage: { used: data.storage.current, limit: data.storage.limit },
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        daysRemaining: data.daysRemaining,
        price: price,
        billingCycle: billingCycle,
        status: subscriptionData?.status || 'active',
        availableQueryModes: data.availableQueryModes || [],
        mediaUsage: data.mediaUsage,
        widgetUsage: data.widgetUsage,
      });

      console.log('[Billing] Usage loaded successfully:', planName);
    } catch (err) {
      console.error('[Billing] Failed to fetch usage:', err);

      // Check if it's an abort error (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load billing data');
      }

      // Set default usage based on subscription from AuthContext
      const planName = (subscription?.plan_name?.toUpperCase() || 'FREE') as PlanName;
      setUsage(getDefaultUsage(planName));
    } finally {
      setLoading(false);
    }
  }, [user, subscription]);

  // Fetch data when auth is ready
  useEffect(() => {
    if (authLoading) {
      console.log('[Billing] Auth still loading...');
      return;
    }

    console.log('[Billing] Auth loaded, user:', user?.id || 'none');
    fetchUsage();
  }, [authLoading, user, fetchUsage]);

  const syncUsage = async () => {
    setSyncing(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/usage', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to sync');
      await fetchUsage();
    } catch (err) {
      console.error('[Billing] Failed to sync usage:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Sync timed out. Please try again.');
      } else {
        setError('Failed to sync usage data');
      }
    } finally {
      setSyncing(false);
    }
  };

  const getPercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Show skeleton while auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign-in prompt if no user
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">{String(t('billing.pleaseSignIn'))}</p>
        <Button asChild>
          <Link href="/auth/signin">{String(t('common.signIn'))}</Link>
        </Button>
      </div>
    );
  }

  const isNearLimit = usage && (
    getPercentage(usage.documents.used, usage.documents.limit) >= 80 ||
    getPercentage(usage.pages.used, usage.pages.limit) >= 80 ||
    getPercentage(usage.queries.used, usage.queries.limit) >= 80 ||
    getPercentage(usage.storage.used, usage.storage.limit) >= 80
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{String(t('billing.title'))}</h1>
          <p className="text-muted-foreground">{String(t('billing.subtitle'))}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={syncUsage}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? String(t('billing.syncing')) : String(t('billing.syncUsage'))}
          </Button>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">
              {usage?.daysRemaining || 0} {String(t('billing.daysRemaining'))}
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchUsage}>
                {String(t('common.retry'))}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {String(t('billing.currentPlan'))}
              </CardTitle>
              <CardDescription>{String(t('billing.subscriptionInfo'))}</CardDescription>
            </div>
            <Badge
              variant={usage?.plan === 'FREE' ? 'secondary' : 'default'}
              className="text-lg px-4 py-1"
            >
              {usage?.plan || 'FREE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {usage?.plan === 'FREE' ? (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{String(t('billing.upgradeToUnlock'))}</p>
                <p className="text-sm text-muted-foreground">
                  {String(t('billing.getMoreFeatures'))}
                </p>
              </div>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/pricing">
                  {String(t('billing.upgradePlan'))} <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{String(t('billing.nextBillingDate'))}: {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : 'N/A'}</span>
                </div>
                <p className="font-semibold text-lg">
                  ${usage?.price || 0}/{usage?.billingCycle === 'yearly' ? String(t('billing.year')) : String(t('billing.month'))}
                </p>
                <Badge variant={usage?.status === 'active' ? 'default' : 'secondary'}>
                  {usage?.status || 'active'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/pricing">{String(t('billing.changePlan'))}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('billing.usageThisPeriod'))}</CardTitle>
          <CardDescription>
            {String(t('billing.resetsOn'))} {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : String(t('billing.endOfMonth'))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{String(t('billing.documents'))}</span>
              </div>
              <span className="text-sm">
                <span className="font-semibold">{usage?.documents.used || 0}</span>
                <span className="text-muted-foreground"> / {usage?.documents.limit || 5}</span>
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getPercentage(usage?.documents.used || 0, usage?.documents.limit || 5))}`}
                style={{ width: `${getPercentage(usage?.documents.used || 0, usage?.documents.limit || 5)}%` }}
              />
            </div>
          </div>

          {/* Pages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-cyan-500" />
                <span className="font-medium">{String(t('billing.pages'))}</span>
              </div>
              <span className="text-sm">
                <span className="font-semibold">{(usage?.pages.used || 0).toLocaleString()}</span>
                <span className="text-muted-foreground"> / {(usage?.pages.limit || 50).toLocaleString()}</span>
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getPercentage(usage?.pages.used || 0, usage?.pages.limit || 50))}`}
                style={{ width: `${getPercentage(usage?.pages.used || 0, usage?.pages.limit || 50)}%` }}
              />
            </div>
          </div>

          {/* Queries */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="font-medium">{String(t('billing.queries'))}</span>
                <span className="text-xs text-muted-foreground">({String(t('billing.thisMonth'))})</span>
              </div>
              <span className="text-sm">
                <span className="font-semibold">{usage?.queries.used || 0}</span>
                <span className="text-muted-foreground"> / {usage?.queries.limit || 20}</span>
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getPercentage(usage?.queries.used || 0, usage?.queries.limit || 20))}`}
                style={{ width: `${getPercentage(usage?.queries.used || 0, usage?.queries.limit || 20)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <span className="font-medium">{String(t('billing.storage'))}</span>
              </div>
              <span className="text-sm">
                <span className="font-semibold">{formatStorage(usage?.storage.used || 0)}</span>
                <span className="text-muted-foreground"> / {formatStorage(usage?.storage.limit || 50 * 1024 * 1024)}</span>
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getPercentage(usage?.storage.used || 0, usage?.storage.limit || 50 * 1024 * 1024))}`}
                style={{ width: `${getPercentage(usage?.storage.used || 0, usage?.storage.limit || 50 * 1024 * 1024)}%` }}
              />
            </div>
          </div>

          {/* Media Usage Section */}
          {usage?.mediaUsage && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-4">{String(t('billing.mediaProcessing'))}</p>
              </div>

              {/* Audio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{String(t('billing.audio'))}</span>
                    <span className="text-xs text-muted-foreground">({String(t('billing.thisMonth'))})</span>
                  </div>
                  <span className="text-sm">
                    <span className={`font-semibold ${usage.mediaUsage.audioUsage.percentage >= 80 ? 'text-red-600' : ''}`}>
                      {usage.mediaUsage.audioUsage.usedFormatted}
                    </span>
                    <span className="text-muted-foreground"> / {usage.mediaUsage.audioUsage.limitFormatted}</span>
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(usage.mediaUsage.audioUsage.percentage)}`}
                    style={{ width: `${usage.mediaUsage.audioUsage.percentage}%` }}
                  />
                </div>
                {usage.mediaUsage.audioUsage.percentage >= 80 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {usage.mediaUsage.audioUsage.percentage >= 100
                      ? String(t('billing.audioLimitReached'))
                      : `${usage.mediaUsage.audioUsage.percentage}% ${String(t('billing.ofAudioLimitUsed'))}`}
                  </p>
                )}
              </div>

              {/* Video */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-pink-500" />
                    <span className="font-medium">{String(t('billing.video'))}</span>
                    <span className="text-xs text-muted-foreground">({String(t('billing.thisMonth'))})</span>
                  </div>
                  <span className="text-sm">
                    <span className={`font-semibold ${usage.mediaUsage.videoUsage.percentage >= 80 ? 'text-red-600' : ''}`}>
                      {usage.mediaUsage.videoUsage.usedFormatted}
                    </span>
                    <span className="text-muted-foreground"> / {usage.mediaUsage.videoUsage.limitFormatted}</span>
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(usage.mediaUsage.videoUsage.percentage)}`}
                    style={{ width: `${usage.mediaUsage.videoUsage.percentage}%` }}
                  />
                </div>
                {usage.mediaUsage.videoUsage.percentage >= 80 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {usage.mediaUsage.videoUsage.percentage >= 100
                      ? String(t('billing.videoLimitReached'))
                      : `${usage.mediaUsage.videoUsage.percentage}% ${String(t('billing.ofVideoLimitUsed'))}`}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Widget Usage Stats */}
      {usage?.widgetUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              Chatbot Widgets
            </CardTitle>
            <CardDescription>
              Widget chatbot usage and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Widget Count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">Widgets Created</span>
                </div>
                <span className="text-sm">
                  <span className="font-semibold">{usage.widgetUsage.used}</span>
                  <span className="text-muted-foreground"> / {usage.widgetUsage.limit}</span>
                </span>
              </div>
              {usage.widgetUsage.limit > 0 && (
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(getPercentage(usage.widgetUsage.used, usage.widgetUsage.limit))}`}
                    style={{ width: `${getPercentage(usage.widgetUsage.used, usage.widgetUsage.limit)}%` }}
                  />
                </div>
              )}
              {usage.widgetUsage.limit === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upgrade to STARTER or higher to create chatbot widgets
                </p>
              )}
            </div>

            {/* Total Widget Queries */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="font-medium">Total Widget Queries</span>
              </div>
              <span className="text-lg font-semibold">{usage.widgetUsage.totalQueries.toLocaleString()}</span>
            </div>

            {/* Individual Widget Stats */}
            {usage.widgetUsage.widgets.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Widget Details</p>
                <div className="space-y-2">
                  {usage.widgetUsage.widgets.map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{widget.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {widget.total_conversations} conversations
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{widget.total_messages}</p>
                        <p className="text-xs text-muted-foreground">messages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {usage.widgetUsage.widgets.length === 0 && usage.widgetUsage.limit > 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No widgets created yet</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/admin/widgets">Create Widget</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt if near limits */}
      {isNearLimit && usage?.plan !== 'BUSINESS' && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{String(t('billing.runningLowOnResources'))}</p>
                <p className="text-sm text-muted-foreground">
                  {String(t('billing.upgradeNowToContinue'))}
                </p>
              </div>
              <Button asChild>
                <Link href="/pricing">{String(t('billing.upgradeNow'))}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Query Modes */}
      {usage?.availableQueryModes && usage.availableQueryModes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{String(t('billing.availableQueryModes'))}</CardTitle>
            <CardDescription>{String(t('billing.ragQueryModesAvailable'))} {usage?.plan || 'FREE'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {usage.availableQueryModes.map((mode) => (
                <Badge key={mode} variant="secondary" className="px-3 py-1 capitalize">
                  {mode}
                </Badge>
              ))}
            </div>
            {usage.plan === 'FREE' && (
              <p className="text-sm text-muted-foreground mt-4">
                {String(t('billing.upgradeToUnlockAdvancedModes'))}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('billing.planFeatures'))}</CardTitle>
          <CardDescription>{String(t('billing.whatsIncluded'))} {usage?.plan || 'FREE'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PLANS[usage?.plan || 'FREE']?.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
