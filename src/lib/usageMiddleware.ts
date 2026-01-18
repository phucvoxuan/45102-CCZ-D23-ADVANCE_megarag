import { NextResponse } from 'next/server';
import { usageService } from '@/services/usageService';

export interface LimitCheckResult {
  ok: boolean;
  response?: NextResponse;
}

/**
 * Check if user can upload more documents
 */
export async function checkDocumentLimit(userId: string): Promise<LimitCheckResult> {
  const check = await usageService.checkLimit(userId, 'documents');

  if (!check.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          type: 'documents',
          message: check.message,
          current: check.current,
          limit: check.limit,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

/**
 * Check if user can process more pages
 */
export async function checkPagesLimit(
  userId: string,
  pageCount: number = 1
): Promise<LimitCheckResult> {
  const check = await usageService.checkLimit(userId, 'pages', pageCount);

  if (!check.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          type: 'pages',
          message: `Page limit reached (${check.current}/${check.limit}). Please upgrade your plan.`,
          current: check.current,
          limit: check.limit,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

/**
 * Check if user can make more queries
 */
export async function checkQueryLimit(userId: string): Promise<LimitCheckResult> {
  const check = await usageService.checkLimit(userId, 'queries');

  if (!check.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          type: 'queries',
          message: check.message,
          current: check.current,
          limit: check.limit,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

/**
 * Check if user has enough storage
 */
export async function checkStorageLimit(
  userId: string,
  fileSize: number
): Promise<LimitCheckResult> {
  const check = await usageService.checkLimit(userId, 'storage', fileSize);

  if (!check.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          type: 'storage',
          message: 'Storage limit exceeded. Please upgrade or delete some files.',
          current: check.current,
          limit: check.limit,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

/**
 * Combined check for document upload (documents + storage)
 */
export async function checkUploadLimits(
  userId: string,
  fileSize: number
): Promise<LimitCheckResult> {
  // Check document limit
  const docCheck = await checkDocumentLimit(userId);
  if (!docCheck.ok) return docCheck;

  // Check storage limit
  const storageCheck = await checkStorageLimit(userId, fileSize);
  if (!storageCheck.ok) return storageCheck;

  return { ok: true };
}

/**
 * Get warning message if approaching limit
 */
export async function getUsageWarning(
  userId: string,
  type: 'documents' | 'pages' | 'queries' | 'storage'
): Promise<string | null> {
  const check = await usageService.checkLimit(userId, type);

  if (check.warningThreshold && check.allowed) {
    return check.message || null;
  }

  return null;
}
