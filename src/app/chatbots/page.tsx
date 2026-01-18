'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  MessageSquare,
  Users,
  Home,
  Settings,
  LayoutDashboard,
  Microscope,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ThemeToggle, Logo, LanguageSwitcher } from '@/components';
import { UserNav } from '@/components/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

interface ChatbotWidget {
  id: string;
  name: string;
  widget_key: string;
  bot_name: string;
  bot_avatar_url: string | null;
  is_active: boolean;
  total_messages: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;
}

export default function ChatbotsPage() {
  const router = useRouter();
  const { user, subscription } = useAuth();
  const { t } = useTranslation();
  const [chatbots, setChatbots] = useState<ChatbotWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user has chatbot access (STARTER, PRO, or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasChatbotAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);

  // Redirect FREE users to pricing page
  useEffect(() => {
    if (!isLoading && !hasChatbotAccess) {
      toast.error('Chatbots feature requires a paid plan. Please upgrade to access.');
      router.push('/pricing');
    }
  }, [isLoading, hasChatbotAccess, router]);

  const fetchChatbots = useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const response = await fetch('/api/chatbots');
      if (!response.ok) throw new Error('Failed to fetch chatbots');
      const data = await response.json();
      setChatbots(data.chatbots || []);
      if (showToast) toast.success('Refreshed');
    } catch (error) {
      console.error('Error fetching chatbots:', error);
      toast.error('Failed to load chatbots');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChatbots();
  }, [fetchChatbots]);

  const handleCreateBot = async () => {
    if (!newBotName.trim()) {
      toast.error('Please enter a bot name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBotName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create chatbot');
      }

      const data = await response.json();
      toast.success('Chatbot created successfully');
      setShowCreateDialog(false);
      setNewBotName('');
      router.push(`/chatbots/${data.chatbot.id}`);
    } catch (error) {
      console.error('Error creating chatbot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create chatbot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBot = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/chatbots/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete chatbot');

      setChatbots((prev) => prev.filter((bot) => bot.id !== id));
      toast.success('Chatbot deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting chatbot:', error);
      toast.error('Failed to delete chatbot');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyWidgetKey = (widgetKey: string) => {
    navigator.clipboard.writeText(widgetKey);
    toast.success('Widget key copied to clipboard');
  };

  const filteredChatbots = chatbots.filter((bot) =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.bot_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background animated-gradient">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
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
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Chatbots</span>
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
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{String(t('common.chat'))}</span>
                </Button>
              </Link>
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

      {/* Sub-header */}
      <div className="border-b px-4 py-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Chatbots</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your AI chatbot widgets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chatbots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchChatbots(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Chatbot
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/3 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredChatbots.length === 0 ? (
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No chatbots found' : 'No chatbots yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first AI chatbot to embed on your website'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chatbot
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChatbots.map((bot) => (
              <Card
                key={bot.id}
                className="hover-lift cursor-pointer group"
                onClick={() => router.push(`/chatbots/${bot.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {bot.bot_avatar_url ? (
                        <img
                          src={bot.bot_avatar_url}
                          alt={bot.bot_name || bot.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base line-clamp-1">
                          {bot.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {bot.bot_name || 'AI Assistant'}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyWidgetKey(bot.widget_key);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Widget Key
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/widget/preview/${bot.widget_key}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview Widget
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(bot.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{bot.total_messages || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{bot.total_conversations || 0}</span>
                      </div>
                    </div>
                    <Badge variant={bot.is_active ? 'default' : 'secondary'}>
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chatbot</DialogTitle>
            <DialogDescription>
              Give your chatbot a name to get started. You can customize it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Chatbot Name</Label>
              <Input
                id="bot-name"
                placeholder="e.g., Customer Support Bot"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBot()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBot} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Chatbot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chatbot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chatbot? This action cannot be undone.
              All conversations and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteBot(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
