'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, Key, BarChart3, Settings, Menu, X, FileText, Users, GitBranch, Network, BookOpen, Home, CreditCard, UserCircle, MessageSquare, Microscope, LayoutDashboard, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserNav } from '@/components/auth';
import { Logo, LanguageSwitcher, ThemeToggle } from '@/components';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();
  const { subscription } = useAuth();

  // Check if user has chatbot access (STARTER, PRO, or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasChatbotAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);

  const navItems = [
    { href: '/admin', label: String(t('admin.dashboard')), icon: BarChart3 },
    { href: '/admin/documents', label: String(t('admin.documents')), icon: FileText },
    { href: '/admin/entities', label: String(t('admin.entities')), icon: Users },
    { href: '/admin/relations', label: String(t('admin.relations')), icon: GitBranch },
    { href: '/admin/knowledge-graph', label: String(t('admin.knowledgeGraph')), icon: Network },
    { href: '/admin/api-keys', label: String(t('admin.apiKeys')), icon: Key },
    { href: '/admin/api-docs', label: String(t('admin.apiDocs')), icon: BookOpen },
    { href: '/admin/billing', label: String(t('admin.billingUsage')), icon: CreditCard },
    { href: '/admin/profile', label: String(t('admin.profile')), icon: UserCircle },
    { href: '/admin/settings', label: String(t('admin.settings')), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Same as Dashboard */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo size="sm" showText={false} />
              <div className="text-left">
                <h1 className="text-2xl font-bold">AIDORag</h1>
                <p className="text-sm text-muted-foreground">
                  Multi-Modal RAG System
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  {String(t('common.home'))}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {String(t('common.dashboard'))}
                </Button>
              </Link>
              <Link href="/dashboard/chat">
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {String(t('common.chat'))}
                </Button>
              </Link>
              {hasChatbotAccess && (
                <Link href="/chatbots">
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    {String(t('common.chatbots'))}
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/explorer">
                <Button variant="outline" size="sm">
                  <Microscope className="h-4 w-4 mr-2" />
                  {String(t('common.explorer'))}
                </Button>
              </Link>
              <UserNav showAuthButtons={false} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-20 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-[73px] bottom-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">{String(t('admin.title'))}</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="lg:ml-64 flex-1 min-h-[calc(100vh-73px)]">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
