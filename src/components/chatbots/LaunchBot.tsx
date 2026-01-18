'use client';

import { useState } from 'react';
import { Copy, Check, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  widget_key: string;
  button_position: string;
  button_draggable: boolean;
  auto_open_chat: boolean;
  auto_open_delay: number;
  custom_css: string | null;
  button_icon_url: string | null;
  open_in_new_tab: boolean;
}

interface LaunchBotProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function LaunchBot({ chatbot, onUpdate }: LaunchBotProps) {
  const [formData, setFormData] = useState({
    button_position: chatbot.button_position || 'bottom-right',
    button_draggable: chatbot.button_draggable ?? false,
    auto_open_chat: chatbot.auto_open_chat ?? false,
    auto_open_delay: chatbot.auto_open_delay || 3,
    custom_css: chatbot.custom_css || '',
    button_icon_url: chatbot.button_icon_url || '',
    open_in_new_tab: chatbot.open_in_new_tab ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Generate embed code
  const embedScript = `<script src="${baseUrl}/widget.js" data-widget-key="${chatbot.widget_key}"></script>`;

  const embedIframe = `<iframe
  src="${baseUrl}/widget/embed/${chatbot.widget_key}"
  style="border: none; position: fixed; ${formData.button_position === 'bottom-left' ? 'left: 20px' : 'right: 20px'}; bottom: 20px; width: 400px; height: 600px; z-index: 9999;"
  allow="microphone"
></iframe>`;

  const chatWebUrl = `${baseUrl}/chat/${chatbot.widget_key}`;

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>
            Add this code to your website to display the chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="script">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="script">Script Tag</TabsTrigger>
              <TabsTrigger value="iframe">iFrame</TabsTrigger>
              <TabsTrigger value="link">Direct Link</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{embedScript}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedScript, 'script')}
                >
                  {copiedCode === 'script' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this script tag before the closing {'</body>'} tag of your website.
              </p>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  <code>{embedIframe}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedIframe, 'iframe')}
                >
                  {copiedCode === 'iframe' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this iFrame if you need more control over the widget placement.
              </p>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="flex gap-2">
                <Input value={chatWebUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(chatWebUrl, 'link')}
                >
                  {copiedCode === 'link' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <a href={chatWebUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link directly with users or embed it in a button.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widget Key</CardTitle>
          <CardDescription>
            Your unique widget identifier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={chatbot.widget_key} readOnly className="font-mono" />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(chatbot.widget_key, 'key')}
            >
              {copiedCode === 'key' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widget Position</CardTitle>
          <CardDescription>
            Configure where and how the chat button appears
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Button Position</Label>
              <Select
                value={formData.button_position}
                onValueChange={(value) => handleChange('button_position', value)}
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
              <Label>Auto Open Delay (seconds)</Label>
              <Input
                type="number"
                min="0"
                max="60"
                value={formData.auto_open_delay}
                onChange={(e) => handleChange('auto_open_delay', parseInt(e.target.value) || 0)}
                disabled={!formData.auto_open_chat}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Draggable Button</Label>
                <p className="text-xs text-muted-foreground">
                  Allow users to drag the chat button
                </p>
              </div>
              <Switch
                checked={formData.button_draggable}
                onCheckedChange={(checked) => handleChange('button_draggable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Open Chat</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically open chat after delay
                </p>
              </div>
              <Switch
                checked={formData.auto_open_chat}
                onCheckedChange={(checked) => handleChange('auto_open_chat', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Open in New Tab</Label>
                <p className="text-xs text-muted-foreground">
                  Open chat in a new browser tab
                </p>
              </div>
              <Switch
                checked={formData.open_in_new_tab}
                onCheckedChange={(checked) => handleChange('open_in_new_tab', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Button Icon</CardTitle>
          <CardDescription>
            Use a custom icon for the chat button (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={formData.button_icon_url}
            onChange={(e) => handleChange('button_icon_url', e.target.value)}
            placeholder="https://example.com/icon.png"
          />
          {formData.button_icon_url && (
            <div className="flex items-center gap-2 mt-2">
              <img
                src={formData.button_icon_url}
                alt="Button icon preview"
                className="w-10 h-10 rounded-full object-cover border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
          <CardDescription>
            Add custom styles to the widget (advanced)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.custom_css}
            onChange={(e) => handleChange('custom_css', e.target.value)}
            placeholder=".widget-container { /* your styles */ }"
            rows={4}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <a href={`/widget/preview/${chatbot.widget_key}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Widget
          </a>
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
