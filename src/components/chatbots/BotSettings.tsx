'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  answer_length: string;
  answer_tone: string;
  auto_reply: boolean;
  show_answer_source: boolean;
  allow_emoji: boolean;
  auto_suggestion: boolean;
  collect_visitor_info: boolean;
  unknown_answer_action: string;
  unknown_answer_text: string;
}

interface BotSettingsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

export function BotSettings({ chatbot, onUpdate }: BotSettingsProps) {
  const [formData, setFormData] = useState({
    answer_length: chatbot.answer_length || 'normal',
    answer_tone: chatbot.answer_tone || 'professional',
    auto_reply: chatbot.auto_reply ?? true,
    show_answer_source: chatbot.show_answer_source ?? true,
    allow_emoji: chatbot.allow_emoji ?? false,
    auto_suggestion: chatbot.auto_suggestion ?? true,
    collect_visitor_info: chatbot.collect_visitor_info ?? false,
    unknown_answer_action: chatbot.unknown_answer_action || 'ai_generated',
    unknown_answer_text: chatbot.unknown_answer_text || "Sorry, I don't have enough information to answer this question.",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
          <CardDescription>
            Configure how your chatbot responds to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Answer Length</Label>
              <Select
                value={formData.answer_length}
                onValueChange={(value) => handleChange('answer_length', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short - Brief and concise</SelectItem>
                  <SelectItem value="normal">Normal - Balanced responses</SelectItem>
                  <SelectItem value="long">Long - Detailed explanations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Answer Tone</Label>
              <Select
                value={formData.answer_tone}
                onValueChange={(value) => handleChange('answer_tone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="gentle">Gentle</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Reply</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically respond to user messages
                </p>
              </div>
              <Switch
                checked={formData.auto_reply}
                onCheckedChange={(checked) => handleChange('auto_reply', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Answer Source</Label>
                <p className="text-xs text-muted-foreground">
                  Display source references with answers
                </p>
              </div>
              <Switch
                checked={formData.show_answer_source}
                onCheckedChange={(checked) => handleChange('show_answer_source', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Emoji</Label>
                <p className="text-xs text-muted-foreground">
                  Include emojis in bot responses
                </p>
              </div>
              <Switch
                checked={formData.allow_emoji}
                onCheckedChange={(checked) => handleChange('allow_emoji', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Suggestion</Label>
                <p className="text-xs text-muted-foreground">
                  Show suggested questions to users
                </p>
              </div>
              <Switch
                checked={formData.auto_suggestion}
                onCheckedChange={(checked) => handleChange('auto_suggestion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Collect Visitor Info</Label>
                <p className="text-xs text-muted-foreground">
                  Ask for visitor's name and email before chat
                </p>
              </div>
              <Switch
                checked={formData.collect_visitor_info}
                onCheckedChange={(checked) => handleChange('collect_visitor_info', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unknown Answer Handling</CardTitle>
          <CardDescription>
            What to do when the bot cannot find an answer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={formData.unknown_answer_action}
              onValueChange={(value) => handleChange('unknown_answer_action', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_generated">AI Generated - Let AI create a response</SelectItem>
                <SelectItem value="input_answer">Custom Message - Show predefined text</SelectItem>
                <SelectItem value="no_reply">No Reply - Don't respond</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.unknown_answer_action === 'input_answer' && (
            <div className="space-y-2">
              <Label>Custom Unknown Answer Message</Label>
              <Textarea
                value={formData.unknown_answer_text}
                onChange={(e) => handleChange('unknown_answer_text', e.target.value)}
                placeholder="Sorry, I don't have enough information to answer this question."
                rows={3}
              />
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
