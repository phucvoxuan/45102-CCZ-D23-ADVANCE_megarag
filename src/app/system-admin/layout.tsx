import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/auth-server';
import { SystemAdminSidebar } from '@/components/system-admin/SystemAdminSidebar';

// Super Admin email - only this user can access /system-admin
const SUPER_ADMIN_EMAIL = 'phucvoxuan@gmail.com';

export default async function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Only allow Super Admin email
  if (user.email !== SUPER_ADMIN_EMAIL) {
    redirect('/admin'); // Redirect to user dashboard
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SystemAdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
