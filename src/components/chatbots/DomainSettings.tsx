'use client';

import { useState } from 'react';
import { Save, Globe, Link2, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  widget_key: string;
  custom_domain: string | null;
  chat_web_url: string | null;
  favicon_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

interface DomainSettingsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function DomainSettings({ chatbot, onUpdate }: DomainSettingsProps) {
  const [formData, setFormData] = useState({
    custom_domain: chatbot.custom_domain || '',
    chat_web_url: chatbot.chat_web_url || '',
    favicon_url: chatbot.favicon_url || '',
    meta_title: chatbot.meta_title || '',
    meta_description: chatbot.meta_description || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultChatUrl = `${baseUrl}/chat/${chatbot.widget_key}`;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        custom_domain: formData.custom_domain || null,
        chat_web_url: formData.chat_web_url || null,
        favicon_url: formData.favicon_url || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      });
      setHasChanges(false);
      toast.success('Domain settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Chat Web URL
          </CardTitle>
          <CardDescription>
            The standalone chat page URL for your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default URL</Label>
            <div className="flex gap-2">
              <Input value={defaultChatUrl} readOnly className="font-mono text-sm bg-muted" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(defaultChatUrl);
                  toast.success('Copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is the default chat page URL provided by AIDORag
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat_web_url">Custom Chat URL (Optional)</Label>
            <Input
              id="chat_web_url"
              value={formData.chat_web_url}
              onChange={(e) => handleChange('chat_web_url', e.target.value)}
              placeholder="https://chat.yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              Redirect users to a custom URL instead of the default
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for the chat widget (requires DNS configuration)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom_domain">Custom Domain</Label>
            <Input
              id="custom_domain"
              value={formData.custom_domain}
              onChange={(e) => handleChange('custom_domain', e.target.value)}
              placeholder="chat.yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              Enter your custom domain without https://
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">DNS Configuration</h4>
            <p className="text-xs text-muted-foreground mb-2">
              Add the following CNAME record to your DNS settings:
            </p>
            <div className="bg-background p-3 rounded border font-mono text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Type</span>
                <span className="text-muted-foreground">Name</span>
                <span className="text-muted-foreground">Value</span>
                <span>CNAME</span>
                <span>chat</span>
                <span>widget.aidorag.com</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            SEO & Meta Tags
          </CardTitle>
          <CardDescription>
            Customize how your chat page appears in search results and social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Page Title</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value)}
              placeholder="Chat with AI Assistant"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {formData.meta_title.length}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              placeholder="Get instant answers from our AI-powered assistant..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {formData.meta_description.length}/160 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Custom favicon for the chat page browser tab
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="favicon_url">Favicon URL</Label>
            <Input
              id="favicon_url"
              value={formData.favicon_url}
              onChange={(e) => handleChange('favicon_url', e.target.value)}
              placeholder="https://yourdomain.com/favicon.ico"
            />
          </div>
          {formData.favicon_url && (
            <div className="flex items-center gap-3">
              <img
                src={formData.favicon_url}
                alt="Favicon preview"
                className="w-8 h-8 object-contain border rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-sm text-muted-foreground">Preview</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
