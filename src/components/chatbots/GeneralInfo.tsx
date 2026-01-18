'use client';

import { useState } from 'react';
import { Save, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  name: string;
  bot_name: string;
  bot_avatar_url: string | null;
  welcome_message_en: string;
  welcome_message_vi: string;
  placeholder_en: string;
  placeholder_vi: string;
  default_language: string;
  system_prompt: string | null;
}

interface GeneralInfoProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function GeneralInfo({ chatbot, onUpdate }: GeneralInfoProps) {
  const [formData, setFormData] = useState({
    name: chatbot.name || '',
    bot_name: chatbot.bot_name || '',
    bot_avatar_url: chatbot.bot_avatar_url || '',
    welcome_message_en: chatbot.welcome_message_en || '',
    welcome_message_vi: chatbot.welcome_message_vi || '',
    placeholder_en: chatbot.placeholder_en || '',
    placeholder_vi: chatbot.placeholder_vi || '',
    default_language: chatbot.default_language || 'en',
    system_prompt: chatbot.system_prompt || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setHasChanges(false);
      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the basic settings for your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Chatbot Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="My Chatbot"
              />
              <p className="text-xs text-muted-foreground">
                Internal name for your reference
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot_name">Bot Display Name</Label>
              <Input
                id="bot_name"
                value={formData.bot_name}
                onChange={(e) => handleChange('bot_name', e.target.value)}
                placeholder="AI Assistant"
              />
              <p className="text-xs text-muted-foreground">
                Name shown to users in the chat
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_avatar_url">Bot Avatar URL</Label>
            <div className="flex gap-2">
              <Input
                id="bot_avatar_url"
                value={formData.bot_avatar_url}
                onChange={(e) => handleChange('bot_avatar_url', e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="flex-1"
              />
              {formData.bot_avatar_url && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleChange('bot_avatar_url', '')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {formData.bot_avatar_url && (
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={formData.bot_avatar_url}
                  alt="Bot avatar preview"
                  className="w-10 h-10 rounded-full object-cover border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_language">Default Language</Label>
            <Select
              value={formData.default_language}
              onValueChange={(value) => handleChange('default_language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="vi">Vietnamese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Welcome Messages</CardTitle>
          <CardDescription>
            Configure greeting messages for each language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome_message_en">English Welcome Message</Label>
            <Textarea
              id="welcome_message_en"
              value={formData.welcome_message_en}
              onChange={(e) => handleChange('welcome_message_en', e.target.value)}
              placeholder="Hello! How can I help you today?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome_message_vi">Vietnamese Welcome Message</Label>
            <Textarea
              id="welcome_message_vi"
              value={formData.welcome_message_vi}
              onChange={(e) => handleChange('welcome_message_vi', e.target.value)}
              placeholder="Xin chào! Tôi có thể giúp gì cho bạn?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placeholder Text</CardTitle>
          <CardDescription>
            Input placeholder text for each language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="placeholder_en">English Placeholder</Label>
              <Input
                id="placeholder_en"
                value={formData.placeholder_en}
                onChange={(e) => handleChange('placeholder_en', e.target.value)}
                placeholder="Type your message..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeholder_vi">Vietnamese Placeholder</Label>
              <Input
                id="placeholder_vi"
                value={formData.placeholder_vi}
                onChange={(e) => handleChange('placeholder_vi', e.target.value)}
                placeholder="Nhập tin nhắn của bạn..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>
            Custom instructions for the AI assistant (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.system_prompt}
            onChange={(e) => handleChange('system_prompt', e.target.value)}
            placeholder="You are a helpful customer support assistant..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            This prompt will guide the AI's behavior and responses
          </p>
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
