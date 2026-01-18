'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Zap,
  Database,
  FileText,
  Loader2,
  Users,
  GitBranch,
  MessageSquare,
  MessageCircleQuestion,
  Key,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';

interface Stats {
  documents: {
    total: number;
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
  chunks: number;
  entities: number;
  relations: number;
  chat_sessions: number;
  api_keys: number;
  usage: {
    total_api_requests: number;
    total_chat_messages: number;
    billing_queries: number; // Queries that count against plan limits
    total_llm_input_tokens: number;
    total_llm_output_tokens: number;
    total_embedding_requests: number;
    total_storage_bytes: number;
  };
  recent_documents: Array<{
    id: string;
    file_name: string;
    file_type: string;
    status: string;
    created_at: string;
  }>;
  entity_types: Array<{
    type: string;
    count: number;
  }>;
  widget_stats?: {
    conversations: number;
    messages: number;
    faq_embeddings: number;
  };
}

const entityTypeColors: Record<string, string> = {
  PERSON: 'bg-blue-500',
  ORGANIZATION: 'bg-purple-500',
  LOCATION: 'bg-green-500',
  DATE: 'bg-orange-500',
  EVENT: 'bg-pink-500',
  CONCEPT: 'bg-yellow-500',
  TECHNOLOGY: 'bg-cyan-500',
  PRODUCT: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const { subscription } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Check if user has API access (PRO or BUSINESS plan)
  const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
  const hasApiAccess = ['PRO', 'BUSINESS'].includes(planName);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/admin/stats', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.success) {
        setStats(data.data);
        if (data.warning) {
          setWarning(data.warning);
        }
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(String(t('admin.requestTimedOut')));
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{String(t('admin.loadingDashboard'))}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{String(t('admin.dashboard'))}</h1>
          <p className="text-muted-foreground">
            {String(t('admin.overview'))}
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{String(t('admin.errorLoadingDashboard'))}</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {String(t('common.retry'))}
            </Button>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>{String(t('admin.setupRequired'))}</CardTitle>
            <CardDescription>
              {String(t('admin.databaseSetupDescription'))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {String(t('admin.runSqlFiles'))}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><code className="bg-muted px-1 rounded">supabase/core_schema.sql</code></li>
              <li><code className="bg-muted px-1 rounded">supabase/white_label_schema.sql</code></li>
              <li><code className="bg-muted px-1 rounded">supabase/chat_tables.sql</code></li>
              <li><code className="bg-muted px-1 rounded">supabase/add_chat_settings.sql</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docCompletionRate = stats?.documents.total
    ? Math.round((stats.documents.completed / stats.documents.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{String(t('admin.dashboard'))}</h1>
        <p className="text-muted-foreground">
          {String(t('admin.overview'))}
        </p>
      </div>

      {/* Warning Alert */}
      {warning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{String(t('admin.setupRequired'))}</AlertTitle>
          <AlertDescription>
            {warning}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.documents'))}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents.total || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={docCompletionRate} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{docCompletionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.documents.completed || 0} {String(t('admin.processed'))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.entities'))}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.entities || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {String(t('admin.extractedFromDocuments'))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.relations'))}</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.relations || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {String(t('admin.knowledgeGraphConnections'))}
            </p>
          </CardContent>
        </Card>

        {hasApiAccess ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{String(t('admin.apiRequests'))}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(stats?.usage?.total_api_requests || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{String(t('admin.thisMonth'))}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="opacity-75">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{String(t('admin.apiRequests'))}</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/pricing" className="text-primary hover:underline">
                  {String(t('admin.upgradeToPro'))}
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.documentChunks'))}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber((stats?.chunks || 0) - (stats?.widget_stats?.faq_embeddings || 0))}
            </div>
            <p className="text-xs text-muted-foreground">{String(t('admin.indexedTextSegments'))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.faqEmbeddings'))}</CardTitle>
            <MessageCircleQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.widget_stats?.faq_embeddings || 0)}</div>
            <p className="text-xs text-muted-foreground">{String(t('admin.fromChatbotFaqs'))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.llmTokens'))}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                (stats?.usage?.total_llm_input_tokens || 0) +
                  (stats?.usage?.total_llm_output_tokens || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">{String(t('admin.inputOutput'))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('admin.chatSessions'))}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chat_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">{String(t('admin.totalConversations'))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('billing.queries'))}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.usage?.billing_queries || 0)}</div>
            <p className="text-xs text-muted-foreground">{String(t('admin.thisMonthBilling'))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{String(t('billing.storage'))}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats?.usage?.total_storage_bytes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{String(t('admin.totalUsed'))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{String(t('admin.recentDocuments'))}</CardTitle>
              <CardDescription>{String(t('admin.latestUploads'))}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/documents">
                {String(t('common.viewAll'))} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.file_type.split('/').pop()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">{String(t('dashboard.noDocumentsYet'))}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Types Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{String(t('admin.entityDistribution'))}</CardTitle>
              <CardDescription>{String(t('admin.topEntityTypes'))}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/entities">
                {String(t('common.viewAll'))} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.entity_types && stats.entity_types.length > 0 ? (
              <div className="space-y-3">
                {stats.entity_types.slice(0, 6).map((et) => {
                  const maxCount = stats.entity_types[0].count;
                  const percentage = Math.round((et.count / maxCount) * 100);
                  const color = entityTypeColors[et.type] || 'bg-gray-500';

                  return (
                    <div key={et.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span>{et.type}</span>
                        </div>
                        <span className="text-muted-foreground">{formatNumber(et.count)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Users className="h-8 w-8 mb-2" />
                <p className="text-sm">{String(t('admin.noEntitiesYet'))}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{String(t('admin.quickActions'))}</CardTitle>
          <CardDescription>{String(t('admin.uploadAndOrganize'))}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/documents">
                <FileText className="h-5 w-5" />
                <span>{String(t('admin.manageDocuments'))}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/knowledge-graph">
                <GitBranch className="h-5 w-5" />
                <span>{String(t('admin.viewKnowledgeGraph'))}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/api-keys">
                <Key className="h-5 w-5" />
                <span>{String(t('admin.manageApiKeys'))}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/admin/api-docs">
                <BarChart3 className="h-5 w-5" />
                <span>{String(t('admin.apiDocumentation'))}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
