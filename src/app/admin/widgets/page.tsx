'use client';

import { useEffect, useState } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Lock,
  ArrowUpRight,
  Settings,
  Eye,
  EyeOff,
  Globe,
  MessageSquare,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Widget {
  id: string;
  name: string;
  widget_key: string;
  theme: {
    primaryColor?: string;
    position?: string;
  };
  bot_name: string;
  bot_avatar_url: string | null;
  welcome_message_en: string;
  welcome_message_vi: string;
  placeholder_en: string;
  placeholder_vi: string;
  default_language: 'en' | 'vi';
  allowed_domains: string[];
  system_prompt: string | null;
  rag_mode: string;
  max_tokens: number;
  show_powered_by: boolean;
  auto_open_delay: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_conversations: number;
  total_messages: number;
}

export default function WidgetsPage() {
  const { user, subscription, isLoading: authLoading } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [widgetLimit, setWidgetLimit] = useState(0);
  const [canCreate, setCanCreate] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    botName: 'AI Assistant',
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    welcomeMessageEn: 'Hi! How can I help you today?',
    welcomeMessageVi: 'Xin chào! Tôi có thể giúp gì cho bạn?',
    placeholderEn: 'Type a message...',
    placeholderVi: 'Nhập tin nhắn...',
    defaultLanguage: 'vi' as 'en' | 'vi',
    allowedDomains: '',
    systemPrompt: '',
    ragMode: 'mix',
    showPoweredBy: true,
    autoOpenDelay: 0,
    isActive: true,
  });

  // Check if user has widget access (STARTER, PRO, BUSINESS)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasWidgetAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);

  useEffect(() => {
    if (!authLoading && user && hasWidgetAccess) {
      loadData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, user, hasWidgetAccess]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/widgets');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWidgets(data.data.widgets || []);
          setWidgetLimit(data.data.limit);
          setCanCreate(data.data.canCreate);
        }
      }
    } catch (error) {
      console.error('Failed to load widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      botName: 'AI Assistant',
      primaryColor: '#3B82F6',
      position: 'bottom-right',
      welcomeMessageEn: 'Hi! How can I help you today?',
      welcomeMessageVi: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      placeholderEn: 'Type a message...',
      placeholderVi: 'Nhập tin nhắn...',
      defaultLanguage: 'vi',
      allowedDomains: '',
      systemPrompt: '',
      ragMode: 'mix',
      showPoweredBy: true,
      autoOpenDelay: 0,
      isActive: true,
    });
  };

  const handleCreateWidget = async () => {
    if (!formData.name.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          botName: formData.botName,
          theme: {
            primaryColor: formData.primaryColor,
            position: formData.position,
          },
          welcomeMessageEn: formData.welcomeMessageEn,
          welcomeMessageVi: formData.welcomeMessageVi,
          placeholderEn: formData.placeholderEn,
          placeholderVi: formData.placeholderVi,
          defaultLanguage: formData.defaultLanguage,
          allowedDomains: formData.allowedDomains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
          systemPrompt: formData.systemPrompt || null,
          ragMode: formData.ragMode,
          autoOpenDelay: formData.autoOpenDelay,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWidgets((prev) => [data.data, ...prev]);
        setCreateDialogOpen(false);
        resetForm();
        setCanCreate(widgets.length + 1 < widgetLimit);
      }
    } catch (error) {
      console.error('Failed to create widget:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setFormData({
      name: widget.name,
      botName: widget.bot_name,
      primaryColor: widget.theme?.primaryColor || '#3B82F6',
      position: widget.theme?.position || 'bottom-right',
      welcomeMessageEn: widget.welcome_message_en,
      welcomeMessageVi: widget.welcome_message_vi,
      placeholderEn: widget.placeholder_en,
      placeholderVi: widget.placeholder_vi,
      defaultLanguage: widget.default_language,
      allowedDomains: widget.allowed_domains.join(', '),
      systemPrompt: widget.system_prompt || '',
      ragMode: widget.rag_mode,
      showPoweredBy: widget.show_powered_by,
      autoOpenDelay: widget.auto_open_delay,
      isActive: widget.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleSaveWidget = async () => {
    if (!selectedWidget) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/widgets/${selectedWidget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          botName: formData.botName,
          theme: {
            primaryColor: formData.primaryColor,
            position: formData.position,
          },
          welcomeMessageEn: formData.welcomeMessageEn,
          welcomeMessageVi: formData.welcomeMessageVi,
          placeholderEn: formData.placeholderEn,
          placeholderVi: formData.placeholderVi,
          defaultLanguage: formData.defaultLanguage,
          allowedDomains: formData.allowedDomains
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean),
          systemPrompt: formData.systemPrompt || null,
          ragMode: formData.ragMode,
          showPoweredBy: formData.showPoweredBy,
          autoOpenDelay: formData.autoOpenDelay,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWidgets((prev) =>
          prev.map((w) => (w.id === selectedWidget.id ? data.data : w))
        );
        setEditDialogOpen(false);
        setSelectedWidget(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update widget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget? All conversations will be lost.')) return;

    try {
      const res = await fetch(`/api/admin/widgets/${widgetId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        setCanCreate(true);
      }
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  const handleShowCode = (widget: Widget) => {
    setSelectedWidget(widget);
    setCodeDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEmbedCode = (widget: Widget) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.aidorag.com';
    return `<script src="${baseUrl}/widget/aidorag-widget.js" data-widget-key="${widget.widget_key}"></script>`;
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show upgrade message for FREE plan
  if (!hasWidgetAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Widgets</h1>
          <p className="text-muted-foreground">
            Embed AI chatbots on your website
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Widget Access Required</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Upgrade to STARTER or higher to create embeddable chatbot widgets.
              Add AI-powered chat to your website in minutes.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/pricing">
                  Upgrade Now
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Current plan: <Badge variant="secondary">{planName}</Badge>
            </p>
          </CardContent>
        </Card>

        {/* Widget Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle>What you get with Widgets</CardTitle>
            <CardDescription>
              Available in STARTER, PRO, and BUSINESS plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Embeddable AI Chatbot</p>
                  <p className="text-sm text-muted-foreground">Add a chat widget to any website with a single script tag</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Domain Restrictions</p>
                  <p className="text-sm text-muted-foreground">Control which websites can use your widget</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">RAG-Powered Responses</p>
                  <p className="text-sm text-muted-foreground">Widget uses your knowledge base to answer questions</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Widgets</h1>
          <p className="text-muted-foreground">
            Create and manage embeddable chat widgets ({widgets.length}/{widgetLimit === 999 ? '∞' : widgetLimit})
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Widget</DialogTitle>
              <DialogDescription>
                Configure your embeddable chatbot widget
              </DialogDescription>
            </DialogHeader>
            <WidgetForm
              formData={formData}
              setFormData={setFormData}
              planName={planName}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateWidget} disabled={!formData.name.trim() || isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Widget'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widget List */}
      <div className="grid gap-4">
        {widgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No widgets yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first chatbot widget to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          widgets.map((widget) => (
            <Card key={widget.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: widget.theme?.primaryColor || '#3B82F6' }}
                    >
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{widget.name}</h3>
                        {widget.is_active ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {widget.bot_name} • {widget.default_language === 'vi' ? 'Vietnamese' : 'English'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {widget.total_conversations} conversations
                        </span>
                        <span>{widget.total_messages} messages</span>
                        {widget.allowed_domains.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {widget.allowed_domains.length} domain(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowCode(widget)}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Get Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditWidget(widget)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteWidget(widget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>
              Update your widget settings
            </DialogDescription>
          </DialogHeader>
          <WidgetForm
            formData={formData}
            setFormData={setFormData}
            planName={planName}
            isEdit
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWidget} disabled={!formData.name.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
            <DialogDescription>
              Copy this code and paste it before the closing &lt;/body&gt; tag on your website
            </DialogDescription>
          </DialogHeader>
          {selectedWidget && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
                {getEmbedCode(selectedWidget)}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(getEmbedCode(selectedWidget))}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCodeDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Widget Form Component
function WidgetForm({
  formData,
  setFormData,
  planName,
  isEdit = false,
}: {
  formData: {
    name: string;
    botName: string;
    primaryColor: string;
    position: string;
    welcomeMessageEn: string;
    welcomeMessageVi: string;
    placeholderEn: string;
    placeholderVi: string;
    defaultLanguage: 'en' | 'vi';
    allowedDomains: string;
    systemPrompt: string;
    ragMode: string;
    showPoweredBy: boolean;
    autoOpenDelay: number;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  planName: string;
  isEdit?: boolean;
}) {
  const isStarter = planName === 'STARTER';

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Widget Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Support Chat"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="botName">Bot Display Name</Label>
          <Input
            id="botName"
            placeholder="e.g., AI Assistant"
            value={formData.botName}
            onChange={(e) => setFormData((prev) => ({ ...prev, botName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultLanguage">Default Language</Label>
          <Select
            value={formData.defaultLanguage}
            onValueChange={(value: 'en' | 'vi') =>
              setFormData((prev) => ({ ...prev, defaultLanguage: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Vietnamese</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeEn">Welcome Message (EN)</Label>
            <Textarea
              id="welcomeEn"
              rows={2}
              value={formData.welcomeMessageEn}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, welcomeMessageEn: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeVi">Welcome Message (VI)</Label>
            <Textarea
              id="welcomeVi"
              rows={2}
              value={formData.welcomeMessageVi}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, welcomeMessageVi: e.target.value }))
              }
            />
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Widget Active</Label>
              <p className="text-xs text-muted-foreground">
                Disable to stop the widget from loading
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="appearance" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              id="primaryColor"
              className="w-16 h-10 p-1 cursor-pointer"
              value={formData.primaryColor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
              }
            />
            <Input
              value={formData.primaryColor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
              }
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Widget Position</Label>
          <Select
            value={formData.position}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, position: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="autoOpen">Auto Open Delay (seconds)</Label>
          <Input
            type="number"
            id="autoOpen"
            min={0}
            value={formData.autoOpenDelay}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, autoOpenDelay: parseInt(e.target.value) || 0 }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Set to 0 to disable auto-open
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="showPoweredBy">Show &quot;Powered by AIDORag&quot;</Label>
            {isStarter && (
              <p className="text-xs text-muted-foreground">
                Required for STARTER plan
              </p>
            )}
          </div>
          <Switch
            id="showPoweredBy"
            checked={formData.showPoweredBy}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, showPoweredBy: checked }))
            }
            disabled={isStarter}
          />
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="allowedDomains">Allowed Domains</Label>
          <Input
            id="allowedDomains"
            placeholder="example.com, sub.example.com"
            value={formData.allowedDomains}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, allowedDomains: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list. Leave empty to allow all domains.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ragMode">Query Mode</Label>
          <Select
            value={formData.ragMode}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, ragMode: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mix">Mix (Vector + Graph)</SelectItem>
              <SelectItem value="vector">Vector Only</SelectItem>
              <SelectItem value="graph">Graph Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemPrompt">Custom System Prompt</Label>
          <Textarea
            id="systemPrompt"
            rows={4}
            placeholder="Optional: Add custom instructions for the AI..."
            value={formData.systemPrompt}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default prompt
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
