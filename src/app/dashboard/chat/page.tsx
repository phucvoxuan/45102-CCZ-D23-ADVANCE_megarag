'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { History, PanelLeftClose, PanelLeft, Home, Settings, LayoutDashboard, Microscope, MessageSquare, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface, ChatHistory, ThemeToggle, Logo, LanguageSwitcher } from '@/components';
import { UserNav } from '@/components/auth';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatPage() {
  const { t } = useTranslation();
  const { subscription } = useAuth();

  // Check if user has chatbot access (STARTER, PRO, or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasChatbotAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleSessionChange = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  const handleDeleteSession = useCallback((deletedId: string) => {
    if (currentSessionId === deletedId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - Same as Dashboard */}
      <header className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden"
              >
                {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>

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
            </div>

            {/* Page title for mobile */}
            <div className="sm:hidden flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold">{String(t('common.chat'))}</span>
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
              {hasChatbotAccess && (
                <Link href="/chatbots">
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{String(t('common.chatbots'))}</span>
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/explorer">
                <Button variant="outline" size="sm">
                  <Microscope className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.explorer'))}</span>
                </Button>
              </Link>
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
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">{String(t('chat.title'))}</h2>
            <p className="text-xs text-muted-foreground">
              {String(t('chat.subtitle'))}
            </p>
          </div>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Chat History */}
        <aside
          className={`
            ${showSidebar ? 'w-64' : 'w-0'}
            flex-shrink-0 border-r bg-muted/30 transition-all duration-200 overflow-hidden
            hidden md:block
          `}
        >
          <div className="h-full flex flex-col w-64">
            <div className="p-3 border-b flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="font-medium text-sm">{String(t('chat.history'))}</span>
            </div>
            <div className="flex-1 min-h-0">
              <ChatHistory
                currentSessionId={currentSessionId}
                onSelectSession={setCurrentSessionId}
                onDeleteSession={handleDeleteSession}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </aside>

        {/* Chat Interface */}
        <main className="flex-1 min-h-0">
          <div className="h-full">
            <ChatInterface
              sessionId={currentSessionId}
              onSessionChange={handleSessionChange}
              onNewChat={handleNewChat}
              defaultMode="mix"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
