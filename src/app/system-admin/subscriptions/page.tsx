import { supabaseAdmin } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

async function getSubscriptions() {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id (email, full_name)
    `)
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function SubscriptionsPage() {
  const subscriptions = await getSubscriptions();

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'BUSINESS':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'PRO':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'STARTER':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
        return 'destructive';
      case 'canceled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Calculate stats
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const canceledCount = subscriptions.filter(s => s.status === 'canceled').length;
  const trialingCount = subscriptions.filter(s => s.status === 'trialing').length;

  // Calculate MRR (Monthly Recurring Revenue) - accounts for billing cycle
  const prices: Record<string, { monthly: number; yearly: number }> = {
    STARTER: { monthly: 29, yearly: 290 },
    PRO: { monthly: 99, yearly: 990 },
    BUSINESS: { monthly: 299, yearly: 2990 },
  };

  const monthlyRevenue = subscriptions.reduce((total, sub) => {
    if (sub.status !== 'active') return total;
    const price = prices[sub.plan_name];
    if (!price) return total;

    const isYearly = sub.billing_cycle === 'yearly';
    // CORRECT: Yearly subscription MRR = yearly_price / 12
    const monthlyEquivalent = isYearly ? price.yearly / 12 : price.monthly;
    return total + monthlyEquivalent;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Manage all active subscriptions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-sm text-muted-foreground">Total Subscriptions</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{trialingCount}</div>
            <p className="text-sm text-muted-foreground">Trialing</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">${Math.round(monthlyRevenue).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">MRR</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>All subscription records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {(sub.profiles as { full_name?: string })?.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(sub.profiles as { email?: string })?.email || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanBadgeColor(sub.plan_name)}>
                      {sub.plan_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {sub.billing_cycle || 'monthly'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(sub.status)}>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {sub.payment_provider || 'stripe'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {subscriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
