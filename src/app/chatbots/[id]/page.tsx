'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bot,
  Info,
  Settings2,
  Code,
  BarChart3,
  ArrowLeft,
  Home,
  Settings,
  LayoutDashboard,
  Microscope,
  MessageSquare,
  Loader2,
  MessageCircleQuestion,
  MessageCircleWarning,
  Database,
  Wand2,
  Globe,
  Webhook,
  Palette,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle, Logo, LanguageSwitcher } from '@/components';
import { UserNav } from '@/components/auth';
import {
  GeneralInfo,
  BotSettings,
  LaunchBot,
  Analytics,
  FAQsManager,
  KnowledgeBase,
  PromptSettings,
  DomainSettings,
  WebhookSettings,
  AppearanceSettings,
  AllowedDomains,
  UnansweredQuestions,
} from '@/components/chatbots';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

interface ChatbotWidget {
  id: string;
  name: string;
  widget_key: string;
  bot_name: string;
  bot_avatar_url: string | null;
  welcome_message_en: string;
  welcome_message_vi: string;
  placeholder_en: string;
  placeholder_vi: string;
  default_language: string;
  is_active: boolean;
  total_messages: number;
  total_conversations: number;
  system_prompt: string | null;
  answer_length: string;
  answer_tone: string;
  auto_reply: boolean;
  show_answer_source: boolean;
  allow_emoji: boolean;
  auto_suggestion: boolean;
  collect_visitor_info: boolean;
  unknown_answer_action: string;
  unknown_answer_text: string;
  button_position: string;
  button_draggable: boolean;
  auto_open_chat: boolean;
  auto_open_delay: number;
  custom_css: string | null;
  button_icon_url: string | null;
  open_in_new_tab: boolean;
  knowledge_base_ids: string[] | null;
  rag_mode: string;
  max_tokens: number | null;
  // Phase 3 - Domain & SEO
  custom_domain: string | null;
  chat_web_url: string | null;
  favicon_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  // Phase 3 - Webhook
  webhook_url: string | null;
  webhook_events: string[] | null;
  // Phase 3 - Appearance
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  border_radius: number | null;
  font_family: string | null;
  theme_mode: string | null;
  // Phase 3 - Security
  allowed_domains: string[] | null;
  domain_restriction_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

type TabType = 'general' | 'settings' | 'faqs' | 'unanswered' | 'knowledge' | 'prompt' | 'domain' | 'webhook' | 'appearance' | 'security' | 'launch' | 'analytics';

const tabs: { id: TabType; label: string; icon: typeof Info }[] = [
  { id: 'general', label: 'General Information', icon: Info },
  { id: 'settings', label: 'Bot Settings', icon: Settings2 },
  { id: 'faqs', label: 'FAQs', icon: MessageCircleQuestion },
  { id: 'unanswered', label: 'Unanswered', icon: MessageCircleWarning },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'prompt', label: 'Prompt & Model', icon: Wand2 },
  { id: 'domain', label: 'Domain & SEO', icon: Globe },
  { id: 'webhook', label: 'Webhooks', icon: Webhook },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'launch', label: 'Launch Bot', icon: Code },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function ChatbotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [chatbot, setChatbot] = useState<ChatbotWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const chatbotId = params.id as string;

  const fetchChatbot = useCallback(async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Chatbot not found');
          router.push('/chatbots');
          return;
        }
        throw new Error('Failed to fetch chatbot');
      }
      const data = await response.json();
      setChatbot(data.chatbot);
    } catch (error) {
      console.error('Error fetching chatbot:', error);
      toast.error('Failed to load chatbot');
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId, router]);

  useEffect(() => {
    fetchChatbot();
  }, [fetchChatbot]);

  const handleUpdate = async (data: Partial<ChatbotWidget>) => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update chatbot');
      }

      const result = await response.json();
      setChatbot(result.chatbot);
    } catch (error) {
      console.error('Error updating chatbot:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chatbot) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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
      <div className="border-b px-4 py-3 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/chatbots">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {chatbot.bot_avatar_url ? (
                <img
                  src={chatbot.bot_avatar_url}
                  alt={chatbot.bot_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{chatbot.name}</h2>
                  <Badge variant={chatbot.is_active ? 'default' : 'secondary'}>
                    {chatbot.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {chatbot.bot_name || 'AI Assistant'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <nav className="space-y-1 sticky top-32">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-shrink-0"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {activeTab === 'general' && (
              <GeneralInfo chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'settings' && (
              <BotSettings chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'faqs' && <FAQsManager chatbotId={chatbot.id} />}
            {activeTab === 'unanswered' && <UnansweredQuestions chatbotId={chatbot.id} />}
            {activeTab === 'knowledge' && (
              <KnowledgeBase chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'prompt' && (
              <PromptSettings chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'domain' && (
              <DomainSettings chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'webhook' && (
              <WebhookSettings chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'appearance' && (
              <AppearanceSettings chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'security' && (
              <AllowedDomains chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'launch' && (
              <LaunchBot chatbot={chatbot} onUpdate={handleUpdate} />
            )}
            {activeTab === 'analytics' && <Analytics chatbotId={chatbot.id} />}
          </main>
        </div>
      </div>
    </div>
  );
}
