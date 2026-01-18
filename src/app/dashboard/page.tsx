'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, RefreshCw, Microscope, Settings, Home, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploader, DocumentList, ThemeToggle, DocumentListSkeleton, Logo, LanguageSwitcher } from '@/components';
import { UserNav } from '@/components/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getPlanLimits } from '@/lib/plans';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { Document } from '@/types';

export default function DashboardPage() {
  const { subscription } = useAuth();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get max upload size from user's plan
  const planLimits = getPlanLimits(subscription?.plan_name || 'FREE');
  const maxFileSizeMB = Math.round(planLimits.maxUploadBytes / (1024 * 1024));

  // Check if user has chatbot access (STARTER, PRO, or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasChatbotAccess = ['STARTER', 'PRO', 'BUSINESS'].includes(planName);

  const fetchDocuments = useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.documents);
      if (showToast) toast.success(String(t('common.refresh')));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-poll when there are pending/processing documents
  useEffect(() => {
    const hasPendingDocs = documents.some(
      (d) => d.status === 'pending' || d.status === 'processing'
    );

    if (hasPendingDocs) {
      const interval = setInterval(() => {
        fetchDocuments();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  const handleUploadComplete = useCallback((documentId: string) => {
    toast.success(String(t('upload.success')));
    // Refresh the document list
    fetchDocuments();
  }, [fetchDocuments, t]);

  const handleUploadError = useCallback((error: Error) => {
    toast.error(error.message || String(t('upload.error')));
  }, [t]);

  const handleDocumentDelete = useCallback((documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast.success(String(t('common.success')));
  }, [t]);

  const handleDocumentDeleteMultiple = useCallback((documentIds: string[]) => {
    setDocuments(prev => prev.filter(doc => !documentIds.includes(doc.id)));
    toast.success(`${documentIds.length} ${String(t('dashboard.documents')).toLowerCase()}`);
  }, [t]);

  const handleDocumentRename = useCallback((documentId: string, newName: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, file_name: newName } : doc
    ));
    toast.success(String(t('common.success')));
  }, [t]);

  // Calculate stats
  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.status === 'processed').length,
    processing: documents.filter(d => d.status === 'processing').length,
    pending: documents.filter(d => d.status === 'pending').length,
    failed: documents.filter(d => d.status === 'failed').length,
  };

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
              <div className="text-left">
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
                  <Home className="h-4 w-4 mr-2" />
                  {String(t('common.home'))}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => fetchDocuments(true)} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? String(t('common.refreshing')) : String(t('common.refresh'))}
              </Button>
              <Link href="/dashboard/chat">
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {String(t('common.chat'))}
                </Button>
              </Link>
              {hasChatbotAccess && (
                <Link href="/chatbots">
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    {String(t('common.chatbots'))}
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/explorer">
                <Button variant="outline" size="sm">
                  <Microscope className="h-4 w-4 mr-2" />
                  {String(t('common.explorer'))}
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {String(t('common.admin'))}
                </Button>
              </Link>
              <UserNav showAuthButtons={false} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="hover-lift animate-fade-in">
              <CardHeader>
                <CardTitle>{String(t('dashboard.uploadDocuments'))}</CardTitle>
                <CardDescription>
                  {String(t('dashboard.dragAndDrop'))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxFileSizeMB={maxFileSizeMB}
                />
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>{String(t('dashboard.statistics'))}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">{String(t('dashboard.total'))}</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
                    <div className="text-xs text-muted-foreground">{String(t('dashboard.ready'))}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.processing + stats.pending}</div>
                    <div className="text-xs text-muted-foreground">{String(t('dashboard.processing'))}</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-xs text-muted-foreground">{String(t('dashboard.failed'))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Document List */}
          <div className="lg:col-span-2">
            <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader>
                <CardTitle>{String(t('dashboard.documents'))}</CardTitle>
                <CardDescription>
                  {stats.total === 0
                    ? String(t('dashboard.noDocumentsYet'))
                    : `${stats.total} ${String(t('dashboard.inYourLibrary'))}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <DocumentListSkeleton count={3} />
                ) : (
                  <DocumentList
                    documents={documents}
                    onDelete={handleDocumentDelete}
                    onDeleteMultiple={handleDocumentDeleteMultiple}
                    onRename={handleDocumentRename}
                    isLoading={false}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
