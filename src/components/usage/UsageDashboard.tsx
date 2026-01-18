'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  TrendingUp,
  FileText,
  MessageSquare,
  HardDrive,
  File,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface UsageData {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  warningThreshold: boolean;
}

interface UsageSummary {
  documents: UsageData;
  pages: UsageData;
  queries: UsageData;
  storage: UsageData;
  periodStart: string;
  periodEnd: string;
  daysRemaining: number;
  planName: string;
  availableQueryModes: string[];
  availableFeatures: string[];
}

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usage');
      if (!response.ok) throw new Error('Failed to fetch usage');
      const result = await response.json();
      if (result.success) {
        setUsage(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch usage');
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const syncUsage = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/usage', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to sync usage');
      const result = await response.json();
      if (result.success) {
        setUsage(result.data);
      }
    } catch (err) {
      console.error('Failed to sync usage:', err);
    } finally {
      setSyncing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) {
    return <UsageDashboardSkeleton />;
  }

  if (error || !usage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            {error || 'Failed to load usage data'}
          </p>
          <Button onClick={fetchUsage} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasWarning =
    usage.documents.warningThreshold ||
    usage.pages.warningThreshold ||
    usage.queries.warningThreshold ||
    usage.storage.warningThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usage Overview</h2>
          <p className="text-sm text-muted-foreground">
            Current plan:{' '}
            <span className="font-medium text-primary">{usage.planName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={syncUsage}
            disabled={syncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing...' : 'Sync Usage'}
          </Button>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Period:{' '}
              {new Date(usage.periodStart).toLocaleDateString()} -{' '}
              {new Date(usage.periodEnd).toLocaleDateString()}
            </p>
            <p className="text-sm font-medium">
              {usage.daysRemaining} days remaining
            </p>
          </div>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          title="Documents"
          icon={<FileText className="h-4 w-4" />}
          current={usage.documents.current}
          limit={usage.documents.limit}
          percentage={usage.documents.percentage}
          warning={usage.documents.warningThreshold}
          format={(n) => n.toString()}
        />

        <UsageCard
          title="Pages"
          icon={<File className="h-4 w-4" />}
          current={usage.pages.current}
          limit={usage.pages.limit}
          percentage={usage.pages.percentage}
          warning={usage.pages.warningThreshold}
          format={(n) => n.toLocaleString()}
        />

        <UsageCard
          title="Queries"
          icon={<MessageSquare className="h-4 w-4" />}
          current={usage.queries.current}
          limit={usage.queries.limit}
          percentage={usage.queries.percentage}
          warning={usage.queries.warningThreshold}
          format={(n) => n.toLocaleString()}
        />

        <UsageCard
          title="Storage"
          icon={<HardDrive className="h-4 w-4" />}
          current={usage.storage.current}
          limit={usage.storage.limit}
          percentage={usage.storage.percentage}
          warning={usage.storage.warningThreshold}
          format={formatBytes}
        />
      </div>

      {/* Upgrade Prompt */}
      {hasWarning && <UpgradePrompt planName={usage.planName} />}

      {/* Available Features */}
      {usage.availableQueryModes && usage.availableQueryModes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Available Query Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {usage.availableQueryModes.map((mode) => (
                <span
                  key={mode}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                >
                  {mode}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface UsageCardProps {
  title: string;
  icon: React.ReactNode;
  current: number;
  limit: number;
  percentage: number;
  warning: boolean;
  format: (n: number) => string;
}

function UsageCard({
  title,
  icon,
  current,
  limit,
  percentage,
  warning,
  format,
}: UsageCardProps) {
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card className={warning ? 'border-yellow-500 border-2' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {warning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{format(current)}</span>
            <span className="text-muted-foreground">of {format(limit)}</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute h-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {percentage}% used
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UpgradePrompt({ planName }: { planName: string }) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold">Running low on resources?</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade from {planName} for more documents, queries, and
                storage.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
