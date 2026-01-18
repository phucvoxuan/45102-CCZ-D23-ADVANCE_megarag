'use client';

import Link from 'next/link';
import { Microscope, MessageSquare, Home, Settings, LayoutDashboard, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataExplorer, ThemeToggle, Logo, LanguageSwitcher } from '@/components';
import { UserNav } from '@/components/auth';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function ExplorerPage() {
  const { t } = useTranslation();
  const { subscription } = useAuth();

  // Check if user has chatbot access (STARTER, PRO, or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasChatbotAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Same as Dashboard */}
      <header className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo size="sm" showText={false} />
              <div className="text-left hidden sm:block">
                <h1 className="text-2xl font-bold">AIDORag</h1>
                <p className="text-sm text-muted-foreground">
                  Multi-Modal RAG System
                </p>
              </div>
            </Link>

            {/* Page title for mobile */}
            <div className="sm:hidden flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              <span className="font-semibold">{String(t('common.explorer'))}</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.home'))}</span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.dashboard'))}</span>
                </Button>
              </Link>
              <Link href="/dashboard/chat">
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.chat'))}</span>
                </Button>
              </Link>
              {hasChatbotAccess && (
                <Link href="/chatbots">
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{String(t('common.chatbots'))}</span>
                  </Button>
                </Link>
              )}
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.admin'))}</span>
                </Button>
              </Link>
              <UserNav showAuthButtons={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Sub-header with page info */}
      <div className="hidden sm:block border-b px-4 py-2 bg-muted/30">
        <div className="container mx-auto flex items-center gap-2">
          <Microscope className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">{String(t('explorer.title'))}</h2>
            <p className="text-xs text-muted-foreground">
              {String(t('explorer.subtitle'))}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0">
        <DataExplorer />
      </main>
    </div>
  );
}
