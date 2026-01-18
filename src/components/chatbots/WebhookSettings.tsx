'use client';

import { useState } from 'react';
import { Save, Webhook, TestTube, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ChatbotWidget {
  id: string;
  webhook_url: string | null;
  webhook_events: string[] | null;
}

interface WebhookSettingsProps {
  chatbot: ChatbotWidget;
  onUpdate: (data: Partial<ChatbotWidget>) => Promise<void>;
}

const WEBHOOK_EVENTS = [
  {
    id: 'new_message',
    label: 'New Message',
    description: 'Triggered when a user sends a new message',
  },
  {
    id: 'new_conversation',
    label: 'New Conversation',
    description: 'Triggered when a new conversation is started',
  },
  {
    id: 'conversation_closed',
    label: 'Conversation Closed',
    description: 'Triggered when a conversation is marked as closed',
  },
  {
    id: 'no_answer',
    label: 'No Answer Found',
    description: 'Triggered when the bot cannot find an answer',
  },
  {
    id: 'feedback_received',
    label: 'Feedback Received',
    description: 'Triggered when a user provides feedback',
  },
  {
    id: 'visitor_info',
    label: 'Visitor Info Collected',
    description: 'Triggered when visitor information is collected',
  },
];

export function WebhookSettings({ chatbot, onUpdate }: WebhookSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState(chatbot.webhook_url || '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    chatbot.webhook_events || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    setHasChanges(true);
    setTestResult(null);
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      }
      return [...prev, eventId];
    });
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === WEBHOOK_EVENTS.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(WEBHOOK_EVENTS.map((e) => e.id));
    }
    setHasChanges(true);
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: {
            message: 'This is a test webhook from AIDORag',
            chatbot_id: chatbot.id,
          },
        }),
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('Webhook test successful!');
      } else {
        setTestResult('error');
        toast.error(`Webhook test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Webhook test failed: Could not connect to URL');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        webhook_url: webhookUrl || null,
        webhook_events: selectedEvents.length > 0 ? selectedEvents : null,
      });
      setHasChanges(false);
      toast.success('Webhook settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook URL
          </CardTitle>
          <CardDescription>
            Receive real-time notifications when events occur in your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Endpoint URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="webhook_url"
                  value={webhookUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className={
                    webhookUrl && !isValidUrl(webhookUrl)
                      ? 'border-destructive'
                      : testResult === 'success'
                      ? 'border-green-500'
                      : testResult === 'error'
                      ? 'border-destructive'
                      : ''
                  }
                />
                {testResult && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {testResult === 'success' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!webhookUrl || !isValidUrl(webhookUrl) || isTesting}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {webhookUrl && !isValidUrl(webhookUrl) && (
              <p className="text-xs text-destructive">Please enter a valid URL</p>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Webhook Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Must be a publicly accessible HTTPS endpoint</li>
                  <li>Should respond with 2xx status within 30 seconds</li>
                  <li>Will receive POST requests with JSON payload</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                Select which events should trigger webhook notifications
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedEvents.length === WEBHOOK_EVENTS.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {WEBHOOK_EVENTS.map((event) => (
              <label
                key={event.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedEvents.includes(event.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <Checkbox
                  checked={selectedEvents.includes(event.id)}
                  onCheckedChange={() => handleEventToggle(event.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload Example</CardTitle>
          <CardDescription>
            This is an example of the JSON payload sent to your webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`{
  "event": "new_message",
  "timestamp": "2024-01-18T10:30:00Z",
  "chatbot_id": "${chatbot.id}",
  "data": {
    "conversation_id": "conv_123456",
    "message_id": "msg_789012",
    "role": "user",
    "content": "Hello, I need help with...",
    "visitor": {
      "session_id": "sess_abc123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}`}</code>
          </pre>
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
