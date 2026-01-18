'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, AlertTriangle, User, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';

export default function SettingsPage() {
  const { user, subscription, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Wait for auth to load
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading, user]);

  const loadSettings = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if Gemini key is configured via environment variable
      // The app uses a shared GEMINI_API_KEY from .env.local
      const hasKey = !!process.env.NEXT_PUBLIC_HAS_GEMINI_KEY || false;
      setHasGeminiKey(hasKey);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{String(t('settings.pleaseSignIn'))}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{String(t('settings.title'))}</h1>
        <p className="text-muted-foreground">
          {String(t('settings.subtitle'))}
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {String(t('settings.accountDetails'))}
          </CardTitle>
          <CardDescription>
            {String(t('settings.accountInfo'))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {String(t('settings.subscription'))}
          </CardTitle>
          <CardDescription>
            {String(t('settings.currentPlanDetails'))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {subscription?.plan_name || 'FREE'} Plan
            </span>
            {subscription?.status === 'active' && (
              <span className="ml-auto text-sm text-green-600 dark:text-green-400">
                {String(t('settings.active'))}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {String(t('settings.viewDetailedUsage'))}
          </p>
        </CardContent>
      </Card>

      {/* Gemini API Status */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('settings.apiConfiguration'))}</CardTitle>
          <CardDescription>
            {String(t('settings.apiIntegrationStatus'))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasGeminiKey ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg">
              <Check className="h-5 w-5" />
              <span>{String(t('settings.geminiConfigured'))}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>{String(t('settings.geminiStatusUnknown'))}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {String(t('settings.geminiServerSide'))}
          </p>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('settings.apiDocumentation'))}</CardTitle>
          <CardDescription>
            {String(t('settings.quickReference'))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/v1
            </code>
          </div>

          <div>
            <h4 className="font-medium mb-2">{String(t('settings.availableEndpoints'))}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-muted px-1 rounded">POST /documents</code> - {String(t('settings.uploadDocument'))}
              </li>
              <li>
                <code className="bg-muted px-1 rounded">GET /documents</code> - {String(t('settings.listDocuments'))}
              </li>
              <li>
                <code className="bg-muted px-1 rounded">POST /query</code> - {String(t('settings.executeQuery'))}
              </li>
              <li>
                <code className="bg-muted px-1 rounded">POST /chat</code> - {String(t('settings.createChatSession'))}
              </li>
              <li>
                <code className="bg-muted px-1 rounded">POST /chat/:id/messages</code> - {String(t('settings.sendMessage'))}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
