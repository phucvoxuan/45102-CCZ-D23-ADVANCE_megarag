import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, FileText, MessageSquare, DollarSign, TrendingUp, UserPlus, UserMinus, Calculator } from 'lucide-react';

// Pricing configuration
const PRICING: Record<string, { monthly: number; yearly: number }> = {
  STARTER: { monthly: 29, yearly: 290 },
  PRO: { monthly: 99, yearly: 990 },
  BUSINESS: { monthly: 299, yearly: 2990 },
};

async function getStats() {
  // Use admin client to bypass RLS for system-wide stats

  // Total users from profiles
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get all subscriptions with billing_cycle
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_name, status, billing_cycle, created_at, canceled_at');

  const planCounts = {
    FREE: 0,
    STARTER: 0,
    PRO: 0,
    BUSINESS: 0,
  };

  // Track counts by billing cycle for each plan
  const planBillingCounts: Record<string, { monthly: number; yearly: number }> = {
    STARTER: { monthly: 0, yearly: 0 },
    PRO: { monthly: 0, yearly: 0 },
    BUSINESS: { monthly: 0, yearly: 0 },
  };

  let activeSubscriptions = 0;
  let mrr = 0;
  let canceledCount = 0;
  const planRevenue: Record<string, number> = { STARTER: 0, PRO: 0, BUSINESS: 0 };

  // Calculate date for "new this week" metric
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let newThisWeek = 0;

  subscriptions?.forEach((sub) => {
    const plan = sub.plan_name as keyof typeof planCounts;

    // Count all plans
    if (planCounts[plan] !== undefined) {
      planCounts[plan]++;
    }

    // Check for new subscriptions this week
    if (sub.created_at && new Date(sub.created_at) >= oneWeekAgo && sub.status === 'active') {
      newThisWeek++;
    }

    // Count canceled subscriptions
    if (sub.status === 'canceled') {
      canceledCount++;
    }

    // Only count active subscriptions for revenue
    if (sub.status === 'active') {
      activeSubscriptions++;

      const price = PRICING[plan];
      if (price) {
        const isYearly = sub.billing_cycle === 'yearly';
        // CORRECT: Yearly subscription MRR = yearly_price / 12
        const monthlyEquivalent = isYearly ? price.yearly / 12 : price.monthly;

        mrr += monthlyEquivalent;
        planRevenue[plan] = (planRevenue[plan] || 0) + monthlyEquivalent;

        // Track billing cycle counts
        if (planBillingCounts[plan]) {
          if (isYearly) {
            planBillingCounts[plan].yearly++;
          } else {
            planBillingCounts[plan].monthly++;
          }
        }
      }
    }
  });

  // Count FREE users (users without subscription or with FREE plan)
  const paidUsers = planCounts.STARTER + planCounts.PRO + planCounts.BUSINESS;
  planCounts.FREE = Math.max(0, (totalUsers || 0) - paidUsers);

  // Total documents
  const { count: totalDocuments } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true });

  // Total queries (chat messages from users)
  const { count: totalQueries } = await supabaseAdmin
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user');

  // Calculate ARR from MRR
  const arr = mrr * 12;

  // Calculate churn rate: canceled / (canceled + active)
  const totalSubscriptions = canceledCount + activeSubscriptions;
  const churnRate = totalSubscriptions > 0 ? (canceledCount / totalSubscriptions) * 100 : 0;

  // Calculate ARPU (Average Revenue Per User) - only for paying users
  const payingUsers = activeSubscriptions;
  const arpu = payingUsers > 0 ? mrr / payingUsers : 0;

  // Calculate conversion rate: paid users / total users
  const conversionRate = (totalUsers || 0) > 0
    ? (payingUsers / (totalUsers || 1)) * 100
    : 0;

  return {
    totalUsers: totalUsers || 0,
    planCounts,
    planBillingCounts,
    planRevenue,
    totalDocuments: totalDocuments || 0,
    totalQueries: totalQueries || 0,
    activeSubscriptions,
    mrr: Math.round(mrr * 100) / 100, // Round to 2 decimal places
    arr: Math.round(arr * 100) / 100,
    newThisWeek,
    churnRate: Math.round(churnRate * 10) / 10, // Round to 1 decimal place
    arpu: Math.round(arpu * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    canceledCount,
  };
}

export default async function SystemAdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Dashboard</h1>
        <p className="text-muted-foreground">Overview of AIDORag platform</p>
      </div>

      {/* Primary Metrics - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+{stats.newThisWeek}</div>
            <p className="text-xs text-muted-foreground">New paid subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.churnRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.canceledCount} canceled</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Free to paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Calculator className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">${stats.arpu.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg revenue per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total queries made</p>
          </CardContent>
        </Card>
      </div>

      {/* Users by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Users by Plan</CardTitle>
          <CardDescription>Distribution of users across subscription tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold">{stats.planCounts.FREE}</div>
              <div className="text-sm text-muted-foreground">FREE</div>
              <div className="text-xs text-gray-500">$0/mo</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600">{stats.planCounts.STARTER}</div>
              <div className="text-sm text-muted-foreground">STARTER</div>
              <div className="text-xs text-blue-500">$29/mo</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-3xl font-bold text-purple-600">{stats.planCounts.PRO}</div>
              <div className="text-sm text-muted-foreground">PRO</div>
              <div className="text-xs text-purple-500">$99/mo</div>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-3xl font-bold text-amber-600">{stats.planCounts.BUSINESS}</div>
              <div className="text-sm text-muted-foreground">BUSINESS</div>
              <div className="text-xs text-amber-500">$299/mo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Monthly revenue by plan tier (accounts for billing cycle)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Starter Plans</span>
                  <div className="text-xs text-muted-foreground">
                    {stats.planBillingCounts.STARTER.monthly > 0 && `${stats.planBillingCounts.STARTER.monthly} monthly`}
                    {stats.planBillingCounts.STARTER.monthly > 0 && stats.planBillingCounts.STARTER.yearly > 0 && ' + '}
                    {stats.planBillingCounts.STARTER.yearly > 0 && `${stats.planBillingCounts.STARTER.yearly} yearly`}
                    {stats.planBillingCounts.STARTER.monthly === 0 && stats.planBillingCounts.STARTER.yearly === 0 && '0 active'}
                  </div>
                </div>
                <span className="font-semibold">${Math.round(stats.planRevenue.STARTER || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Pro Plans</span>
                  <div className="text-xs text-muted-foreground">
                    {stats.planBillingCounts.PRO.monthly > 0 && `${stats.planBillingCounts.PRO.monthly} monthly`}
                    {stats.planBillingCounts.PRO.monthly > 0 && stats.planBillingCounts.PRO.yearly > 0 && ' + '}
                    {stats.planBillingCounts.PRO.yearly > 0 && `${stats.planBillingCounts.PRO.yearly} yearly`}
                    {stats.planBillingCounts.PRO.monthly === 0 && stats.planBillingCounts.PRO.yearly === 0 && '0 active'}
                  </div>
                </div>
                <span className="font-semibold">${Math.round(stats.planRevenue.PRO || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Business Plans</span>
                  <div className="text-xs text-muted-foreground">
                    {stats.planBillingCounts.BUSINESS.monthly > 0 && `${stats.planBillingCounts.BUSINESS.monthly} monthly`}
                    {stats.planBillingCounts.BUSINESS.monthly > 0 && stats.planBillingCounts.BUSINESS.yearly > 0 && ' + '}
                    {stats.planBillingCounts.BUSINESS.yearly > 0 && `${stats.planBillingCounts.BUSINESS.yearly} yearly`}
                    {stats.planBillingCounts.BUSINESS.monthly === 0 && stats.planBillingCounts.BUSINESS.yearly === 0 && '0 active'}
                  </div>
                </div>
                <span className="font-semibold">${Math.round(stats.planRevenue.BUSINESS || 0).toLocaleString()}/mo</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="font-bold">Total MRR</span>
                <span className="font-bold text-green-600 text-xl">${stats.mrr.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Annual Revenue
            </CardTitle>
            <CardDescription>Projected ARR based on current MRR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              ${stats.arr.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on ${stats.mrr.toLocaleString()} MRR x 12 months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.totalUsers > 0
                  ? Math.round((stats.planCounts.STARTER + stats.planCounts.PRO + stats.planCounts.BUSINESS) / stats.totalUsers * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.totalDocuments > 0 && stats.totalUsers > 0
                  ? Math.round(stats.totalDocuments / stats.totalUsers)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Docs/User</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.totalQueries > 0 && stats.totalUsers > 0
                  ? Math.round(stats.totalQueries / stats.totalUsers)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Queries/User</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
