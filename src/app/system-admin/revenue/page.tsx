import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, CreditCard, UserPlus, UserMinus, Target, Calendar } from 'lucide-react';

const PRICES: Record<string, { monthly: number; yearly: number }> = {
  STARTER: { monthly: 29, yearly: 290 },
  PRO: { monthly: 99, yearly: 990 },
  BUSINESS: { monthly: 299, yearly: 2990 },
};

async function getRevenueStats() {
  // Get all subscriptions with their details
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_name, status, billing_cycle, created_at, canceled_at, payment_provider');

  // Calculate revenue metrics
  let mrr = 0;
  let yearlyRevenue = 0;
  const planRevenue: Record<string, number> = { STARTER: 0, PRO: 0, BUSINESS: 0 };
  const providerRevenue: Record<string, number> = { stripe: 0, payhip: 0 };

  // Growth tracking
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let newThisWeek = 0;
  let newThisMonth = 0;
  let newLastMonth = 0;
  let canceledThisMonth = 0;
  let activeCount = 0;

  subscriptions?.forEach((sub) => {
    const createdAt = new Date(sub.created_at);
    const canceledAt = sub.canceled_at ? new Date(sub.canceled_at) : null;

    // Track new subscriptions
    if (sub.status === 'active' || sub.status === 'canceled') {
      if (createdAt >= oneWeekAgo) newThisWeek++;
      if (createdAt >= oneMonthAgo) newThisMonth++;
      if (createdAt >= twoMonthsAgo && createdAt < oneMonthAgo) newLastMonth++;
    }

    // Track cancellations this month
    if (sub.status === 'canceled' && canceledAt && canceledAt >= oneMonthAgo) {
      canceledThisMonth++;
    }

    if (sub.status !== 'active') return;

    activeCount++;
    const plan = sub.plan_name as keyof typeof PRICES;
    const price = PRICES[plan];
    if (!price) return;

    const isYearly = sub.billing_cycle === 'yearly';
    const monthlyEquivalent = isYearly ? price.yearly / 12 : price.monthly;

    mrr += monthlyEquivalent;
    yearlyRevenue += isYearly ? price.yearly : price.monthly * 12;
    planRevenue[plan] = (planRevenue[plan] || 0) + monthlyEquivalent;

    const provider = sub.payment_provider || 'stripe';
    providerRevenue[provider] = (providerRevenue[provider] || 0) + monthlyEquivalent;
  });

  // Count by billing cycle
  const monthlyCount = subscriptions?.filter(s => s.status === 'active' && s.billing_cycle === 'monthly').length || 0;
  const yearlyCount = subscriptions?.filter(s => s.status === 'active' && s.billing_cycle === 'yearly').length || 0;

  // Count by provider
  const stripeCount = subscriptions?.filter(s => s.status === 'active' && (s.payment_provider === 'stripe' || !s.payment_provider)).length || 0;
  const payhipCount = subscriptions?.filter(s => s.status === 'active' && s.payment_provider === 'payhip').length || 0;

  // Calculate monthly billing vs yearly billing revenue split
  let monthlyBillingRevenue = 0;
  let yearlyBillingRevenue = 0;
  subscriptions?.filter(s => s.status === 'active').forEach((sub) => {
    const plan = sub.plan_name as keyof typeof PRICES;
    const price = PRICES[plan];
    if (!price) return;

    const isYearly = sub.billing_cycle === 'yearly';
    const monthlyEquivalent = isYearly ? price.yearly / 12 : price.monthly;

    if (isYearly) {
      yearlyBillingRevenue += monthlyEquivalent;
    } else {
      monthlyBillingRevenue += monthlyEquivalent;
    }
  });

  // Calculate growth rate
  const growthRate = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : (newThisMonth > 0 ? 100 : 0);

  // Calculate churn rate
  const totalSubscriptions = subscriptions?.length || 0;
  const canceledTotal = subscriptions?.filter(s => s.status === 'canceled').length || 0;
  const churnRate = (activeCount + canceledTotal) > 0 ? (canceledTotal / (activeCount + canceledTotal)) * 100 : 0;

  // Calculate ARPU
  const arpu = activeCount > 0 ? mrr / activeCount : 0;

  // Revenue forecasting (simple linear projection based on growth)
  const monthlyGrowthRate = growthRate / 100;
  const projectedMRR30 = mrr * (1 + monthlyGrowthRate * 0.5);
  const projectedMRR60 = mrr * (1 + monthlyGrowthRate);
  const projectedMRR90 = mrr * (1 + monthlyGrowthRate * 1.5);

  return {
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(yearlyRevenue),
    planRevenue,
    monthlyCount,
    yearlyCount,
    stripeCount,
    payhipCount,
    providerRevenue,
    monthlyBillingRevenue: Math.round(monthlyBillingRevenue * 100) / 100,
    yearlyBillingRevenue: Math.round(yearlyBillingRevenue * 100) / 100,
    newThisWeek,
    newThisMonth,
    newLastMonth,
    canceledThisMonth,
    activeCount,
    growthRate: Math.round(growthRate * 10) / 10,
    churnRate: Math.round(churnRate * 10) / 10,
    arpu: Math.round(arpu * 100) / 100,
    projectedMRR30: Math.round(projectedMRR30),
    projectedMRR60: Math.round(projectedMRR60),
    projectedMRR90: Math.round(projectedMRR90),
  };
}

export default async function RevenuePage() {
  const stats = await getRevenueStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Analytics</h1>
        <p className="text-muted-foreground">Detailed revenue breakdown and metrics</p>
      </div>

      {/* Main Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">${stats.mrr.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">Current MRR from all active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">${stats.arr.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">Projected yearly revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
          <CardDescription>Monthly revenue contribution from each tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <div className="font-medium">Starter Plan</div>
                <div className="text-sm text-muted-foreground">$29/month per user</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ${Math.round(stats.planRevenue.STARTER || 0).toLocaleString()}/mo
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <div className="font-medium">Pro Plan</div>
                <div className="text-sm text-muted-foreground">$99/month per user</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                ${Math.round(stats.planRevenue.PRO || 0).toLocaleString()}/mo
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div>
                <div className="font-medium">Business Plan</div>
                <div className="text-sm text-muted-foreground">$299/month per user</div>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                ${Math.round(stats.planRevenue.BUSINESS || 0).toLocaleString()}/mo
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-600" />
              Subscription Growth
            </CardTitle>
            <CardDescription>New paid subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">This Week</div>
                  <div className="text-sm text-muted-foreground">Last 7 days</div>
                </div>
                <div className="text-2xl font-bold text-cyan-600">+{stats.newThisWeek}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">This Month</div>
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-2xl font-bold text-cyan-600">+{stats.newThisMonth}</div>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <div className="font-medium">Growth Rate</div>
                  <div className="text-sm text-muted-foreground">vs last month ({stats.newLastMonth})</div>
                </div>
                <div className={`text-xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-orange-600" />
              Churn Analysis
            </CardTitle>
            <CardDescription>Subscription cancellations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Churn Rate</div>
                  <div className="text-sm text-muted-foreground">Canceled / Total</div>
                </div>
                <div className={`text-2xl font-bold ${stats.churnRate > 10 ? 'text-red-600' : 'text-orange-600'}`}>
                  {stats.churnRate}%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Canceled This Month</div>
                  <div className="text-sm text-muted-foreground">Last 30 days</div>
                </div>
                <div className="text-xl font-bold">{stats.canceledThisMonth}</div>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <div className="font-medium">ARPU</div>
                  <div className="text-sm text-muted-foreground">Avg revenue per user</div>
                </div>
                <div className="text-xl font-bold text-green-600">${stats.arpu.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            Revenue Forecast
          </CardTitle>
          <CardDescription>Projected MRR based on current growth rate ({stats.growthRate}%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Current MRR</div>
              <div className="text-2xl font-bold text-violet-600">${stats.mrr.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">30 Days</div>
              <div className="text-2xl font-bold text-violet-600">${stats.projectedMRR30.toLocaleString()}</div>
              <div className="text-xs text-green-600">+${(stats.projectedMRR30 - stats.mrr).toLocaleString()}</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">60 Days</div>
              <div className="text-2xl font-bold text-violet-600">${stats.projectedMRR60.toLocaleString()}</div>
              <div className="text-xs text-green-600">+${(stats.projectedMRR60 - stats.mrr).toLocaleString()}</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">90 Days</div>
              <div className="text-2xl font-bold text-violet-600">${stats.projectedMRR90.toLocaleString()}</div>
              <div className="text-xs text-green-600">+${(stats.projectedMRR90 - stats.mrr).toLocaleString()}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Projections are based on current growth rate and assume consistent performance.
          </p>
        </CardContent>
      </Card>

      {/* Billing Cycle & Payment Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Cycles
            </CardTitle>
            <CardDescription>Revenue split by billing frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Monthly Billing</div>
                  <div className="text-sm text-muted-foreground">{stats.monthlyCount} users</div>
                </div>
                <div>
                  <div className="text-xl font-bold">${stats.monthlyBillingRevenue.toLocaleString()}/mo</div>
                  <div className="text-xs text-muted-foreground text-right">
                    {stats.mrr > 0 ? Math.round((stats.monthlyBillingRevenue / stats.mrr) * 100) : 0}% of MRR
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Yearly Billing</div>
                  <div className="text-sm text-muted-foreground">{stats.yearlyCount} users (17% discount)</div>
                </div>
                <div>
                  <div className="text-xl font-bold">${stats.yearlyBillingRevenue.toLocaleString()}/mo</div>
                  <div className="text-xs text-muted-foreground text-right">
                    {stats.mrr > 0 ? Math.round((stats.yearlyBillingRevenue / stats.mrr) * 100) : 0}% of MRR
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Providers
            </CardTitle>
            <CardDescription>Revenue by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Stripe</div>
                  <div className="text-sm text-muted-foreground">{stats.stripeCount} users</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    ${Math.round(stats.providerRevenue.stripe || 0).toLocaleString()}/mo
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {stats.mrr > 0 ? Math.round(((stats.providerRevenue.stripe || 0) / stats.mrr) * 100) : 0}% of MRR
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Payhip</div>
                  <div className="text-sm text-muted-foreground">{stats.payhipCount} users</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">
                    ${Math.round(stats.providerRevenue.payhip || 0).toLocaleString()}/mo
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {stats.mrr > 0 ? Math.round(((stats.providerRevenue.payhip || 0) / stats.mrr) * 100) : 0}% of MRR
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
