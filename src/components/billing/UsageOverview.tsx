'use client';

import { FileText, Files, MessageSquare, HardDrive, AlertTriangle, Music, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PLANS, type PlanName, formatStorage } from '@/lib/stripe/config';
import Link from 'next/link';

interface MediaUsageData {
  used: number;
  limit: number;
  remaining: number;
  usedFormatted: string;
  limitFormatted: string;
  remainingFormatted: string;
  percentage: number;
}

interface UsageOverviewProps {
  planName: PlanName;
  usage: {
    documents: number;
    pages?: number; // Optional for backward compatibility
    queries: number;
    storage: number; // in bytes
  };
  mediaUsage?: {
    audioUsage: MediaUsageData;
    videoUsage: MediaUsageData;
  };
}

export function UsageOverview({ planName, usage, mediaUsage }: UsageOverviewProps) {
  const limits = PLANS[planName]?.limits || PLANS.FREE.limits;

  const calculatePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const metrics = [
    {
      label: 'Documents',
      icon: FileText,
      current: usage.documents,
      limit: limits.documents,
      format: (n: number) => n.toString(),
    },
    {
      label: 'Pages',
      icon: Files,
      current: usage.pages || 0,
      limit: limits.pages,
      format: (n: number) => n.toLocaleString(),
      sublabel: 'total processed',
    },
    {
      label: 'Queries',
      icon: MessageSquare,
      current: usage.queries,
      limit: limits.queries,
      format: (n: number) => n.toLocaleString(),
      sublabel: 'this month',
    },
    {
      label: 'Storage',
      icon: HardDrive,
      current: usage.storage,
      limit: limits.storage,
      format: formatStorage,
    },
  ];

  const hasHighUsage = metrics.some(
    (m) => calculatePercentage(m.current, m.limit) >= 80
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Your current usage for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => {
          const percentage = calculatePercentage(metric.current, metric.limit);
          const progressColor = getProgressColor(percentage);
          const isNearLimit = percentage >= 80;

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{metric.label}</span>
                  {metric.sublabel && (
                    <span className="text-xs text-muted-foreground">
                      ({metric.sublabel})
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <span className={isNearLimit ? 'text-red-600 font-medium' : ''}>
                    {metric.format(metric.current)}
                  </span>
                  <span className="text-muted-foreground">
                    {' / '}
                    {metric.format(metric.limit)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress value={percentage} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {isNearLimit && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {percentage >= 100
                    ? `Limit reached`
                    : `${Math.round(percentage)}% of limit used`}
                </p>
              )}
            </div>
          );
        })}

        {/* Media Usage Section */}
        {mediaUsage && (
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Media Processing</h4>

            {/* Audio Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Audio</span>
                  <span className="text-xs text-muted-foreground">(this month)</span>
                </div>
                <div className="text-sm">
                  <span className={mediaUsage.audioUsage.percentage >= 80 ? 'text-red-600 font-medium' : ''}>
                    {mediaUsage.audioUsage.usedFormatted}
                  </span>
                  <span className="text-muted-foreground">
                    {' / '}
                    {mediaUsage.audioUsage.limitFormatted}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress value={mediaUsage.audioUsage.percentage} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                    mediaUsage.audioUsage.percentage >= 90
                      ? 'bg-red-500'
                      : mediaUsage.audioUsage.percentage >= 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${mediaUsage.audioUsage.percentage}%` }}
                />
              </div>
              {mediaUsage.audioUsage.percentage >= 80 && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {mediaUsage.audioUsage.percentage >= 100
                    ? `Audio limit reached. Remaining: ${mediaUsage.audioUsage.remainingFormatted}`
                    : `${Math.round(mediaUsage.audioUsage.percentage)}% of audio limit used`}
                </p>
              )}
            </div>

            {/* Video Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Video</span>
                  <span className="text-xs text-muted-foreground">(this month)</span>
                </div>
                <div className="text-sm">
                  <span className={mediaUsage.videoUsage.percentage >= 80 ? 'text-red-600 font-medium' : ''}>
                    {mediaUsage.videoUsage.usedFormatted}
                  </span>
                  <span className="text-muted-foreground">
                    {' / '}
                    {mediaUsage.videoUsage.limitFormatted}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress value={mediaUsage.videoUsage.percentage} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                    mediaUsage.videoUsage.percentage >= 90
                      ? 'bg-red-500'
                      : mediaUsage.videoUsage.percentage >= 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${mediaUsage.videoUsage.percentage}%` }}
                />
              </div>
              {mediaUsage.videoUsage.percentage >= 80 && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {mediaUsage.videoUsage.percentage >= 100
                    ? `Video limit reached. Remaining: ${mediaUsage.videoUsage.remainingFormatted}`
                    : `${Math.round(mediaUsage.videoUsage.percentage)}% of video limit used`}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {hasHighUsage && planName !== 'BUSINESS' && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Running low on resources?</p>
                <p className="text-sm text-blue-700 mb-3">
                  Upgrade your plan to get more documents, queries, and storage.
                </p>
                <Button size="sm" asChild>
                  <Link href="/pricing">Upgrade Now</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
