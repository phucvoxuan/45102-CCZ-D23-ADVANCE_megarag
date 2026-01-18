'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Home,
  PanelLeft,
  Newspaper,
  BookOpen,
  GraduationCap,
  History,
  Megaphone,
  Briefcase,
  Code2,
  Ticket,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/system-admin', icon: LayoutDashboard },
  { name: 'Users', href: '/system-admin/users', icon: Users },
  { name: 'Subscriptions', href: '/system-admin/subscriptions', icon: CreditCard },
  { name: 'Revenue', href: '/system-admin/revenue', icon: BarChart3 },
  { name: 'Promo Codes', href: '/system-admin/promo-codes', icon: Ticket },
  { name: 'Documents', href: '/system-admin/documents', icon: FileText },
  { name: 'System Settings', href: '/system-admin/settings', icon: Settings },
];

const cmsNavigation = [
  { name: 'Static Pages', href: '/system-admin/content', icon: PanelLeft },
  { name: 'Blog', href: '/system-admin/blog', icon: Newspaper },
  { name: 'Docs', href: '/system-admin/docs', icon: BookOpen },
  { name: 'Tutorials', href: '/system-admin/tutorials', icon: GraduationCap },
  { name: 'Changelog', href: '/system-admin/changelog', icon: History },
  { name: 'Press', href: '/system-admin/press', icon: Megaphone },
  { name: 'Careers', href: '/system-admin/careers', icon: Briefcase },
  { name: 'SDKs', href: '/system-admin/sdks', icon: Code2 },
];

export function SystemAdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="font-bold text-lg">System Admin</h1>
            <p className="text-xs text-slate-400">AIDORag Control Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              pathname === item.href
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}

        {/* CMS Section */}
        <div className="pt-4 mt-4 border-t border-slate-700">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Content Management
          </p>
          {cmsNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
        >
          <Home className="h-5 w-5" />
          Back to App
        </Link>
      </div>
    </div>
  );
}
