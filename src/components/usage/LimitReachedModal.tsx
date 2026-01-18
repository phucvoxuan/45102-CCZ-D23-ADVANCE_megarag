'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';

export type LimitType = 'documents' | 'pages' | 'queries' | 'storage';

interface LimitReachedModalProps {
  open: boolean;
  onClose: () => void;
  type: LimitType;
  current: number;
  limit: number;
}

const LIMIT_MESSAGES: Record<
  LimitType,
  {
    title: string;
    description: string;
    action: string;
    icon: string;
  }
> = {
  documents: {
    title: 'Document Limit Reached',
    description:
      "You've reached your document upload limit for this billing period.",
    action: 'Upgrade to upload more documents',
    icon: '📄',
  },
  pages: {
    title: 'Page Limit Reached',
    description:
      "You've processed the maximum number of pages for this billing period.",
    action: 'Upgrade for more pages',
    icon: '📑',
  },
  queries: {
    title: 'Query Limit Reached',
    description: "You've used all your queries for this billing period.",
    action: 'Upgrade for more queries',
    icon: '💬',
  },
  storage: {
    title: 'Storage Limit Reached',
    description: "You've run out of storage space.",
    action: 'Upgrade for more storage or delete some files',
    icon: '💾',
  },
};

export function LimitReachedModal({
  open,
  onClose,
  type,
  current,
  limit,
}: LimitReachedModalProps) {
  const message = LIMIT_MESSAGES[type];

  const formatValue = (value: number) => {
    if (type === 'storage') {
      if (value < 1024 * 1024)
        return `${(value / 1024).toFixed(1)} KB`;
      if (value < 1024 * 1024 * 1024)
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
      return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return value.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>{message.icon}</span>
                {message.title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-4">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Current Usage
              </span>
              <span className="font-semibold">
                {formatValue(current)} / {formatValue(limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {message.action}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button asChild className="gap-2">
            <Link href="/pricing">
              <Zap className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
