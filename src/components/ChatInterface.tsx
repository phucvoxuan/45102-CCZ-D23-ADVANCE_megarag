'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader2, Sparkles, Plus, HelpCircle, Search, Users, GitBranch, Layers, Settings, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableQueryModes } from '@/lib/features';
import { useTranslation } from '@/i18n';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChatMessage } from './ChatMessage';
import { SourceReferences } from './SourceReferences';
import type { QueryMode, QueryResponse } from '@/types';
import { AVAILABLE_MODELS, type GeminiModelId } from '@/lib/gemini/models';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/rag/constants';

/**
 * Message type for chat history
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QueryResponse['sources'];
  entities?: QueryResponse['entities'];
  timestamp: Date;
}

interface ChatInterfaceProps {
  sessionId?: string | null;
  onSessionChange?: (sessionId: string) => void;
  onNewChat?: () => void;
  defaultMode?: QueryMode;
}

/**
 * ChatInterface component - main chat UI with query mode selector
 */
export function ChatInterface({
  sessionId,
  onSessionChange,
  onNewChat,
  defaultMode = 'mix'
}: ChatInterfaceProps) {
  const { subscription } = useAuth();
  const { t } = useTranslation();
  const planName = subscription?.plan_name || 'FREE';

  // Get available modes based on user's plan
  const availableModes = useMemo(() => {
    return getAvailableQueryModes(planName);
  }, [planName]);

  // Determine initial mode - use defaultMode if available, otherwise first available
  const initialMode = useMemo(() => {
    if (availableModes.includes(defaultMode)) {
      return defaultMode;
    }
    return availableModes[0] as QueryMode || 'naive';
  }, [availableModes, defaultMode]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryMode, setQueryMode] = useState<QueryMode>(initialMode);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);

  // Chat settings state
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-2.5-flash');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [tempModel, setTempModel] = useState<GeminiModelId>('gemini-2.5-flash');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages when session changes
  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId);
      loadSession(sessionId);
    } else {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [sessionId]);

  const loadSession = async (sid: string) => {
    try {
      const response = await fetch(`/api/chat/${sid}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((m: {
          id: string;
          role: 'user' | 'assistant';
          content: string;
          sources?: QueryResponse['sources'];
          entities?: QueryResponse['entities'];
          created_at: string;
        }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          entities: m.entities,
          timestamp: new Date(m.created_at),
        }));
        setMessages(loadedMessages);

        // Load session settings
        if (data.session) {
          const sessionSystemPrompt = data.session.system_prompt || DEFAULT_SYSTEM_PROMPT;
          const sessionModel = (data.session.model as GeminiModelId) || 'gemini-2.5-flash';
          setSystemPrompt(sessionSystemPrompt);
          setSelectedModel(sessionModel);
          setTempSystemPrompt(sessionSystemPrompt);
          setTempModel(sessionModel);
        }
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  const createSession = async (): Promise<string> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Chat',
        system_prompt: systemPrompt !== DEFAULT_SYSTEM_PROMPT ? systemPrompt : null,
        model: selectedModel,
      }),
    });
    const data = await response.json();
    return data.sessionId;
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Update local state
      setSystemPrompt(tempSystemPrompt);
      setSelectedModel(tempModel);

      // If we have a session, save to database
      if (currentSessionId) {
        await fetch(`/api/chat/${currentSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_prompt: tempSystemPrompt !== DEFAULT_SYSTEM_PROMPT ? tempSystemPrompt : null,
            model: tempModel,
          }),
        });
      }

      setSettingsOpen(false);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetToDefaults = () => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setTempModel('gemini-2.5-flash');
  };

  const saveMessage = async (
    sid: string,
    message: Message,
    queryModeUsed?: string
  ) => {
    try {
      await fetch(`/api/chat/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          sources: message.sources || [],
          entities: message.entities || [],
          query_mode: queryModeUsed,
        }),
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    // Create session if none exists
    let sid = currentSessionId;
    if (!sid) {
      sid = await createSession();
      setCurrentSessionId(sid);
      onSessionChange?.(sid);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    // Save user message
    await saveMessage(sid, userMessage, queryMode);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          mode: queryMode,
          top_k: 10,
          system_prompt: systemPrompt !== DEFAULT_SYSTEM_PROMPT ? systemPrompt : undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query failed');
      }

      const data: QueryResponse = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        entities: data.entities,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await saveMessage(sid, assistantMessage, queryMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage(sid, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSelectedMessage(null);
    setError(null);
    // Reset settings to defaults for new chat
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setSelectedModel('gemini-2.5-flash');
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setTempModel('gemini-2.5-flash');
    onNewChat?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode selector header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Select value={queryMode} onValueChange={(v) => setQueryMode(v as QueryMode)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModes.includes('mix') && (
                  <SelectItem value="mix">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      {String(t('chat.searchModes.mix.name'))}
                    </span>
                  </SelectItem>
                )}
                {availableModes.includes('hybrid') && (
                  <SelectItem value="hybrid">{String(t('chat.searchModes.hybrid.name'))}</SelectItem>
                )}
                {availableModes.includes('local') && (
                  <SelectItem value="local">{String(t('chat.searchModes.local.name'))}</SelectItem>
                )}
                {availableModes.includes('global') && (
                  <SelectItem value="global">{String(t('chat.searchModes.global.name'))}</SelectItem>
                )}
                {availableModes.includes('naive') && (
                  <SelectItem value="naive">{String(t('chat.searchModes.naive.name'))}</SelectItem>
                )}
                {/* Show upgrade prompt if not all modes available */}
                {availableModes.length < 5 && (
                  <div className="px-2 py-2 border-t mt-1">
                    <Link href="/pricing" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                      <Lock className="h-3 w-3" />
                      {String(t('chat.upgradeForMoreModes'))}
                    </Link>
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* Help button with dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{String(t('chat.searchModes.title'))}</DialogTitle>
                  <DialogDescription>
                    {String(t('chat.searchModes.description'))}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {String(t('chat.searchModes.mix.name'))}
                        <Badge variant="secondary" className="text-[10px]">{String(t('chat.searchModes.mix.badge'))}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {String(t('chat.searchModes.mix.description'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <Layers className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{String(t('chat.searchModes.hybrid.name'))}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {String(t('chat.searchModes.hybrid.description'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{String(t('chat.searchModes.local.name'))}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {String(t('chat.searchModes.local.description'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <GitBranch className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{String(t('chat.searchModes.global.name'))}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {String(t('chat.searchModes.global.description'))}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{String(t('chat.searchModes.naive.name'))}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {String(t('chat.searchModes.naive.description'))}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings button */}
            <Dialog open={settingsOpen} onOpenChange={(open) => {
              setSettingsOpen(open);
              if (open) {
                setTempSystemPrompt(systemPrompt);
                setTempModel(selectedModel);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  {String(t('chat.settings'))}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{String(t('chat.settingsTitle'))}</DialogTitle>
                  <DialogDescription>
                    {String(t('chat.settingsDescription'))}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model">{String(t('chat.aiModel'))}</Label>
                    <Select value={tempModel} onValueChange={(v) => setTempModel(v as GeminiModelId)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AVAILABLE_MODELS).map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex flex-col items-start">
                              <span>{model.name}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {String(t('chat.modelDescription'))}
                    </p>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="system-prompt">{String(t('chat.systemPrompt'))}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetToDefaults}
                        className="text-xs"
                      >
                        {String(t('chat.resetToDefault'))}
                      </Button>
                    </div>
                    <Textarea
                      id="system-prompt"
                      value={tempSystemPrompt}
                      onChange={(e) => setTempSystemPrompt(e.target.value)}
                      placeholder={String(t('chat.systemPromptPlaceholder'))}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {String(t('chat.systemPromptDescription'))}
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                    {String(t('common.cancel'))}
                  </Button>
                  <Button onClick={saveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {String(t('chat.saving'))}
                      </>
                    ) : (
                      String(t('chat.saveSettings'))
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <Plus className="h-4 w-4 mr-1" />
              {String(t('chat.newChat'))}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{String(t('chat.askAboutDocuments'))}</h3>
            <p className="text-muted-foreground max-w-md">
              {String(t('chat.askAboutDocumentsDescription'))}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline">{String(t('chat.entities'))}</Badge>
              <Badge variant="outline">{String(t('chat.relationships'))}</Badge>
              <Badge variant="outline">{String(t('chat.sourceCitations'))}</Badge>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => message.role === 'assistant' && message.sources?.length ? setSelectedMessage(message) : null}
                className={message.role === 'assistant' && message.sources?.length ? 'cursor-pointer' : ''}
              >
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  timestamp={message.timestamp}
                />
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="p-4 flex items-center gap-3 bg-muted/30">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {String(t('chat.searchingDocuments'))}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Source panel (side panel when message is selected) */}
      {selectedMessage && selectedMessage.sources && selectedMessage.sources.length > 0 && (
        <div className="flex-shrink-0 border-t max-h-[300px] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{String(t('chat.detailedSources'))}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                {String(t('chat.close'))}
              </Button>
            </div>
            <SourceReferences sources={selectedMessage.sources} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t bg-background p-4">
        {error && (
          <div className="mb-3 p-2 bg-destructive/10 text-destructive text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={String(t('chat.askPlaceholder'))}
            className="min-h-[44px] max-h-[200px] resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 h-[44px] w-[44px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {String(t('chat.enterToSend'))}
        </p>
      </div>
    </div>
  );
}
