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

async function getUsers() {
  // Get profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, created_at, role')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get subscriptions
  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, plan_name, status, billing_cycle');

  const subscriptionMap = new Map();
  subscriptions?.forEach((sub) => {
    subscriptionMap.set(sub.user_id, sub);
  });

  // Get document counts per user
  const { data: documentCounts } = await supabaseAdmin
    .from('documents')
    .select('user_id')
    .not('user_id', 'is', null);

  const userDocCounts = new Map<string, number>();
  documentCounts?.forEach((doc) => {
    const userId = doc.user_id;
    userDocCounts.set(userId, (userDocCounts.get(userId) || 0) + 1);
  });

  return profiles?.map((profile) => ({
    ...profile,
    subscription: subscriptionMap.get(profile.id) || { plan_name: 'FREE', status: 'active', billing_cycle: 'monthly' },
    documentsCount: userDocCounts.get(profile.id) || 0,
  })) || [];
}

export default async function UsersPage() {
  const users = await getUsers();

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

  const totalPaid = users.filter(u => u.subscription.plan_name !== 'FREE').length;
  const totalFree = users.filter(u => u.subscription.plan_name === 'FREE').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">View and manage all registered users</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalPaid}</div>
            <p className="text-sm text-muted-foreground">Paid Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalFree}</div>
            <p className="text-sm text-muted-foreground">Free Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {users.length > 0 ? Math.round((totalPaid / users.length) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>Showing the 100 most recent users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanBadgeColor(user.subscription.plan_name)}>
                      {user.subscription.plan_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.subscription.status === 'active' ? 'default' : 'secondary'}
                    >
                      {user.subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.documentsCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
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
