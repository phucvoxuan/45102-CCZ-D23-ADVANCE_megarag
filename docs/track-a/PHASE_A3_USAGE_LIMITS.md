# PHASE A3: USAGE LIMITS & GATING (UPDATED)

## Thời gian: Day 11-13
## Mục tiêu: Implement usage tracking, limits enforcement, và upgrade prompts

---

## 📊 PLAN LIMITS (CẬP NHẬT THEO PHÂN TÍCH CHI PHÍ)

Dựa trên phân tích chi phí Gemini API:
- Cost per page: ~$0.0003
- Cost per query: ~$0.0004
- Audio: ~$0.0013/min
- Video: ~$0.003/min

### BẢNG GIỚI HẠN MỚI

```typescript
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
      documents: 5,
      pages: 50,           // NEW: Track pages separately
      queries: 100,        // UPDATED: Tăng từ 20 lên 100 (queries rẻ)
      storage: 50 * 1024 * 1024, // 50MB
    },
    features: [
      '5 documents',
      '50 pages total',
      '100 queries/month',
      '50MB storage',
      'Naive query mode only',
      'Community support',
    ],
    // Estimated cost per user: ~$0.50/month max
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    priceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    limits: {
      documents: 50,
      pages: 500,          // NEW
      queries: 1000,       // UPDATED: Tăng từ 500 lên 1,000
      storage: 1 * 1024 * 1024 * 1024, // 1GB
    },
    features: [
      '50 documents',
      '500 pages total',
      '1,000 queries/month',
      '1GB storage',
      'All 5 query modes',
      'Knowledge graph',
      'Email support',
    ],
    // Estimated cost: ~$13/month → Margin: 55%
  },
  PRO: {
    name: 'Pro',
    price: 99,
    priceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      documents: 200,      // UPDATED: Giảm từ 500 xuống 200
      pages: 2000,         // NEW
      queries: 5000,       // Giữ nguyên
      storage: 5 * 1024 * 1024 * 1024, // UPDATED: Giảm từ 10GB xuống 5GB
    },
    features: [
      '200 documents',
      '2,000 pages total',
      '5,000 queries/month',
      '5GB storage',
      'All features',
      'API access',
      'Priority support',
      '3 team members',
    ],
    // Estimated cost: ~$45/month → Margin: 55%
  },
  BUSINESS: {
    name: 'Business',
    price: 299,
    priceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
    priceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    limits: {
      documents: 1000,     // UPDATED: Giảm từ 2,000 xuống 1,000
      pages: 10000,        // NEW
      queries: 20000,      // Giữ nguyên
      storage: 20 * 1024 * 1024 * 1024, // UPDATED: Giảm từ 50GB xuống 20GB
    },
    features: [
      '1,000 documents',
      '10,000 pages total',
      '20,000 queries/month',
      '20GB storage',
      'All features',
      'Team members (up to 10)',
      'Advanced analytics',
      'Webhook integrations',
      'Dedicated support',
    ],
    // Estimated cost: ~$140/month → Margin: 53%
  },
}
```

---

## TỔNG QUAN PHASE A3

```
Day 11: Usage Tracking System
Day 12: Limit Enforcement & Gating
Day 13: Usage Dashboard & Upgrade Prompts
```

---

## DAY 11: USAGE TRACKING SYSTEM

### PROMPT 11.1 - Review & Enhance Usage Service

```
Kiểm tra và tạo UsageService với limits mới:

File: `src/services/usageService.ts`
```

```typescript
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/config'

export interface UsageRecord {
  documentsCount: number
  pagesCount: number        // NEW: Track pages
  queriesCount: number
  storageBytes: number
  periodStart: Date
  periodEnd: Date
}

export interface UsageLimits {
  documents: number
  pages: number             // NEW
  queries: number
  storage: number
}

export interface UsageCheckResult {
  allowed: boolean
  current: number
  limit: number
  percentage: number
  warningThreshold: boolean // true if > 80%
  message?: string
}

export class UsageService {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  private async getClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  // Get current billing period for user
  async getCurrentPeriod(userId: string): Promise<{ start: Date; end: Date }> {
    const supabase = await this.getClient()
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', userId)
      .single()

    if (subscription?.current_period_start) {
      return {
        start: new Date(subscription.current_period_start),
        end: new Date(subscription.current_period_end),
      }
    }

    // Default to current month for free tier
    const now = new Date()
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    }
  }

  // Get or create usage record for current period
  async getOrCreateUsageRecord(userId: string): Promise<UsageRecord> {
    const supabase = await this.getClient()
    const period = await this.getCurrentPeriod(userId)
    
    // Try to get existing record
    let { data: usage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', period.start.toISOString())
      .lte('period_start', period.end.toISOString())
      .single()

    if (!usage) {
      // Create new record for this period
      const { data: newUsage, error } = await supabase
        .from('usage_records')
        .insert({
          user_id: userId,
          period_start: period.start.toISOString(),
          period_end: period.end.toISOString(),
          documents_count: 0,
          pages_count: 0,
          queries_count: 0,
          storage_bytes: 0,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating usage record:', error)
        // Return default values if insert fails
        return {
          documentsCount: 0,
          pagesCount: 0,
          queriesCount: 0,
          storageBytes: 0,
          periodStart: period.start,
          periodEnd: period.end,
        }
      }
      
      usage = newUsage
    }

    return {
      documentsCount: usage.documents_count || 0,
      pagesCount: usage.pages_count || 0,
      queriesCount: usage.queries_count || 0,
      storageBytes: usage.storage_bytes || 0,
      periodStart: new Date(usage.period_start),
      periodEnd: new Date(usage.period_end),
    }
  }

  // Get plan limits for user
  async getPlanLimits(userId: string): Promise<UsageLimits> {
    const supabase = await this.getClient()
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .single()

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE'
    const plan = PLANS[planName as keyof typeof PLANS] || PLANS.FREE

    return plan.limits
  }

  // Check if action is allowed
  async checkLimit(
    userId: string,
    type: 'documents' | 'pages' | 'queries' | 'storage',
    additionalAmount: number = 1
  ): Promise<UsageCheckResult> {
    const usage = await this.getOrCreateUsageRecord(userId)
    const limits = await this.getPlanLimits(userId)

    const currentMap = {
      documents: usage.documentsCount,
      pages: usage.pagesCount,
      queries: usage.queriesCount,
      storage: usage.storageBytes,
    }

    const limitMap = {
      documents: limits.documents,
      pages: limits.pages,
      queries: limits.queries,
      storage: limits.storage,
    }

    const current = currentMap[type]
    const limit = limitMap[type]
    const afterAction = current + additionalAmount
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0
    const allowed = afterAction <= limit

    return {
      allowed,
      current,
      limit,
      percentage,
      warningThreshold: percentage >= 80,
      message: allowed
        ? percentage >= 80
          ? `You've used ${percentage}% of your ${type} limit`
          : undefined
        : `${type.charAt(0).toUpperCase() + type.slice(1)} limit reached. Please upgrade your plan.`,
    }
  }

  // Increment usage
  async incrementUsage(
    userId: string,
    type: 'documents' | 'pages' | 'queries' | 'storage',
    amount: number = 1
  ): Promise<void> {
    const supabase = await this.getClient()
    const period = await this.getCurrentPeriod(userId)

    const columnMap = {
      documents: 'documents_count',
      pages: 'pages_count',
      queries: 'queries_count',
      storage: 'storage_bytes',
    }

    // First ensure record exists
    await this.getOrCreateUsageRecord(userId)

    // Then increment
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_period_start: period.start.toISOString(),
      p_column: columnMap[type],
      p_amount: amount,
    })
  }

  // Decrement usage (for document deletion)
  async decrementUsage(
    userId: string,
    type: 'documents' | 'pages' | 'storage',
    amount: number = 1
  ): Promise<void> {
    const supabase = await this.getClient()
    const period = await this.getCurrentPeriod(userId)

    const columnMap = {
      documents: 'documents_count',
      pages: 'pages_count',
      storage: 'storage_bytes',
    }

    await supabase.rpc('decrement_usage', {
      p_user_id: userId,
      p_period_start: period.start.toISOString(),
      p_column: columnMap[type],
      p_amount: amount,
    })
  }

  // Get usage summary for dashboard
  async getUsageSummary(userId: string): Promise<{
    documents: UsageCheckResult
    pages: UsageCheckResult
    queries: UsageCheckResult
    storage: UsageCheckResult
    periodStart: Date
    periodEnd: Date
    daysRemaining: number
    planName: string
  }> {
    const usage = await this.getOrCreateUsageRecord(userId)
    const limits = await this.getPlanLimits(userId)
    
    // Get plan name
    const supabase = await this.getClient()
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .single()
    
    const planName = subscription?.plan_name || 'FREE'

    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil(
      (usage.periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ))

    const createResult = (current: number, limit: number): UsageCheckResult => ({
      allowed: current < limit,
      current,
      limit,
      percentage: limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0,
      warningThreshold: limit > 0 ? current >= limit * 0.8 : false,
    })

    return {
      documents: createResult(usage.documentsCount, limits.documents),
      pages: createResult(usage.pagesCount, limits.pages),
      queries: createResult(usage.queriesCount, limits.queries),
      storage: createResult(usage.storageBytes, limits.storage),
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
      daysRemaining,
      planName,
    }
  }

  // Reset usage for new period (called by webhook)
  async resetUsage(userId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    const supabase = await this.getClient()

    await supabase.from('usage_records').insert({
      user_id: userId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      documents_count: 0,
      pages_count: 0,
      queries_count: 0,
      storage_bytes: 0,
    })
  }
}

export const usageService = new UsageService()
```

### PROMPT 11.2 - Database Schema for Usage

```
Tạo/update database schema cho usage tracking:

File: `supabase/migrations/003_usage_tables.sql`
```

```sql
-- Usage Records Table (nếu chưa có)
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  documents_count INTEGER DEFAULT 0,
  pages_count INTEGER DEFAULT 0,
  queries_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(user_id, period_start);

-- Function to increment usage atomically
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_column TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Upsert usage record
  INSERT INTO usage_records (user_id, period_start, period_end)
  VALUES (
    p_user_id,
    p_period_start,
    p_period_start + INTERVAL '1 month'
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;

  -- Increment the specified column
  EXECUTE format(
    'UPDATE usage_records SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() 
     WHERE user_id = $2 AND period_start = $3',
    p_column, p_column
  ) USING p_amount, p_user_id, p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage atomically
CREATE OR REPLACE FUNCTION decrement_usage(
  p_user_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_column TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE usage_records SET %I = GREATEST(0, COALESCE(%I, 0) - $1), updated_at = NOW() 
     WHERE user_id = $2 AND period_start = $3',
    p_column, p_column
  ) USING p_amount, p_user_id, p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total document count
CREATE OR REPLACE FUNCTION get_user_document_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM documents 
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- Function to get user's total storage used
CREATE OR REPLACE FUNCTION get_user_storage_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(file_size), 0)::BIGINT 
  FROM documents 
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;
```

---

## DAY 12: LIMIT ENFORCEMENT & GATING

### PROMPT 12.1 - Create Usage Middleware

```
Tạo middleware để check usage trước mỗi action:

File: `src/middleware/usageMiddleware.ts`
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { usageService } from '@/services/usageService'
import { createClient } from '@/lib/supabase/server'

export async function checkDocumentLimit(userId: string): Promise<{
  ok: boolean
  response?: NextResponse
}> {
  const check = await usageService.checkLimit(userId, 'documents')

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
    }
  }

  return { ok: true }
}

export async function checkPagesLimit(userId: string, pageCount: number = 1): Promise<{
  ok: boolean
  response?: NextResponse
}> {
  const check = await usageService.checkLimit(userId, 'pages', pageCount)

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
    }
  }

  return { ok: true }
}

export async function checkQueryLimit(userId: string): Promise<{
  ok: boolean
  response?: NextResponse
}> {
  const check = await usageService.checkLimit(userId, 'queries')

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
    }
  }

  return { ok: true }
}

export async function checkStorageLimit(
  userId: string,
  fileSize: number
): Promise<{
  ok: boolean
  response?: NextResponse
}> {
  const check = await usageService.checkLimit(userId, 'storage', fileSize)

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
    }
  }

  return { ok: true }
}

// Helper to get user from request
export async function getUserFromRequest(
  request: NextRequest
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return user?.id || null
}
```

### PROMPT 12.2 - Feature Gating by Plan

```
Tạo system để gate features by plan:

File: `src/lib/features.ts`
```

```typescript
export const FEATURE_ACCESS = {
  // RAG Modes
  NAIVE_MODE: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  LOCAL_MODE: ['STARTER', 'PRO', 'BUSINESS'],
  GLOBAL_MODE: ['STARTER', 'PRO', 'BUSINESS'],
  HYBRID_MODE: ['PRO', 'BUSINESS'],
  MIX_MODE: ['PRO', 'BUSINESS'],
  
  // Features
  KNOWLEDGE_GRAPH: ['STARTER', 'PRO', 'BUSINESS'],
  API_ACCESS: ['PRO', 'BUSINESS'],
  CUSTOM_BRANDING: ['PRO', 'BUSINESS'],
  TEAM_MEMBERS: ['BUSINESS'],
  ADVANCED_ANALYTICS: ['BUSINESS'],
  WEBHOOKS: ['BUSINESS'],
  PRIORITY_SUPPORT: ['PRO', 'BUSINESS'],
  DEDICATED_SUPPORT: ['BUSINESS'],
  
  // File Types
  AUDIO_UPLOAD: ['STARTER', 'PRO', 'BUSINESS'],
  VIDEO_UPLOAD: ['PRO', 'BUSINESS'],
} as const

export type FeatureKey = keyof typeof FEATURE_ACCESS

export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const normalizedPlan = planName?.toUpperCase() || 'FREE'
  const allowedPlans = FEATURE_ACCESS[feature]
  return allowedPlans.includes(normalizedPlan as any)
}

export function getAvailableFeatures(planName: string): FeatureKey[] {
  return (Object.keys(FEATURE_ACCESS) as FeatureKey[]).filter(
    (feature) => hasFeatureAccess(planName, feature)
  )
}

export function getUpgradeFeatures(currentPlan: string): {
  feature: FeatureKey
  requiredPlan: string
}[] {
  const planOrder = ['FREE', 'STARTER', 'PRO', 'BUSINESS']
  const normalizedPlan = currentPlan?.toUpperCase() || 'FREE'
  const currentIndex = planOrder.indexOf(normalizedPlan)

  return (Object.keys(FEATURE_ACCESS) as FeatureKey[])
    .filter((feature) => !hasFeatureAccess(normalizedPlan, feature))
    .map((feature) => {
      const requiredPlans = FEATURE_ACCESS[feature]
      const requiredPlan = requiredPlans.find(
        (plan) => planOrder.indexOf(plan) > currentIndex
      )
      return { feature, requiredPlan: requiredPlan! }
    })
    .filter(item => item.requiredPlan)
}

// Available query modes by plan
export function getAvailableQueryModes(planName: string): string[] {
  const normalizedPlan = planName?.toUpperCase() || 'FREE'
  const modes = ['naive']
  
  if (hasFeatureAccess(normalizedPlan, 'LOCAL_MODE')) modes.push('local')
  if (hasFeatureAccess(normalizedPlan, 'GLOBAL_MODE')) modes.push('global')
  if (hasFeatureAccess(normalizedPlan, 'HYBRID_MODE')) modes.push('hybrid')
  if (hasFeatureAccess(normalizedPlan, 'MIX_MODE')) modes.push('mix')
  
  return modes
}
```

---

## DAY 13: USAGE DASHBOARD & UPGRADE PROMPTS

### PROMPT 13.1 - Create Usage API Endpoint

```
Tạo API endpoint cho usage data:

File: `src/app/api/usage/route.ts`
```

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { usageService } from '@/services/usageService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get usage summary
    const summary = await usageService.getUsageSummary(user.id)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Failed to get usage' }, { status: 500 })
  }
}
```

### PROMPT 13.2 - Create Usage Dashboard Component

```
Tạo component hiển thị usage:

File: `src/components/usage/UsageDashboard.tsx`
```

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, FileText, MessageSquare, HardDrive, File } from 'lucide-react'
import Link from 'next/link'

interface UsageData {
  current: number
  limit: number
  percentage: number
  warningThreshold: boolean
}

interface UsageSummary {
  documents: UsageData
  pages: UsageData
  queries: UsageData
  storage: UsageData
  periodStart: string
  periodEnd: string
  daysRemaining: number
  planName: string
}

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (!response.ok) throw new Error('Failed to fetch usage')
      const data = await response.json()
      setUsage(data)
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  if (loading) {
    return <UsageDashboardSkeleton />
  }

  if (error || !usage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">{error || 'Failed to load usage data'}</p>
        </CardContent>
      </Card>
    )
  }

  const hasWarning = usage.documents.warningThreshold || 
                     usage.pages.warningThreshold ||
                     usage.queries.warningThreshold || 
                     usage.storage.warningThreshold

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Usage Overview</h2>
          <p className="text-sm text-muted-foreground">
            Current plan: <span className="font-medium">{usage.planName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            Period: {new Date(usage.periodStart).toLocaleDateString()} - {new Date(usage.periodEnd).toLocaleDateString()}
          </p>
          <p className="text-sm font-medium">
            {usage.daysRemaining} days remaining
          </p>
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
    </div>
  )
}

interface UsageCardProps {
  title: string
  icon: React.ReactNode
  current: number
  limit: number
  percentage: number
  warning: boolean
  format: (n: number) => string
}

function UsageCard({ title, icon, current, limit, percentage, warning, format }: UsageCardProps) {
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-primary'
  }

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
  )
}

function UpgradePrompt({ planName }: { planName: string }) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Running low on resources?</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade from {planName} for more documents, queries, and storage.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
  )
}
```

### PROMPT 13.3 - Create Limit Reached Modal

```
Tạo modal hiển thị khi limit reached:

File: `src/components/usage/LimitReachedModal.tsx`
```

```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Zap } from 'lucide-react'
import Link from 'next/link'

interface LimitReachedModalProps {
  open: boolean
  onClose: () => void
  type: 'documents' | 'pages' | 'queries' | 'storage'
  current: number
  limit: number
}

const LIMIT_MESSAGES = {
  documents: {
    title: 'Document Limit Reached',
    description: "You've reached your document upload limit for this billing period.",
    action: 'Upgrade to upload more documents',
    icon: '📄',
  },
  pages: {
    title: 'Page Limit Reached',
    description: "You've processed the maximum number of pages for this billing period.",
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
}

export function LimitReachedModal({
  open,
  onClose,
  type,
  current,
  limit,
}: LimitReachedModalProps) {
  const message = LIMIT_MESSAGES[type]

  const formatValue = (value: number) => {
    if (type === 'storage') {
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
      if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
      return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
    return value.toLocaleString()
  }

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
              <span className="text-sm text-muted-foreground">Current Usage</span>
              <span className="font-semibold">{formatValue(current)} / {formatValue(limit)}</span>
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
  )
}
```

### PROMPT 13.4 - Create Limit Modal Hook

```
Tạo hook quản lý limit modal:

File: `src/hooks/useLimitModal.ts`
```

```typescript
'use client'

import { create } from 'zustand'

type LimitType = 'documents' | 'pages' | 'queries' | 'storage'

interface LimitModalState {
  open: boolean
  type: LimitType | null
  current: number
  limit: number
  show: (type: LimitType, current: number, limit: number) => void
  hide: () => void
}

export const useLimitModal = create<LimitModalState>((set) => ({
  open: false,
  type: null,
  current: 0,
  limit: 0,
  show: (type, current, limit) => set({ open: true, type, current, limit }),
  hide: () => set({ open: false, type: null, current: 0, limit: 0 }),
}))

// Hook for API calls with limit checking
export function useApiWithLimits() {
  const { show: showLimitModal } = useLimitModal()

  const fetchWithLimitCheck = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options)
    
    if (response.status === 403) {
      const data = await response.json()
      if (data.error === 'LIMIT_EXCEEDED') {
        showLimitModal(data.type, data.current, data.limit)
        throw new Error(data.message)
      }
    }
    
    if (!response.ok) {
      throw new Error('Request failed')
    }
    
    return response
  }

  return { fetchWithLimitCheck }
}
```

---

## FILES CẦN TẠO/UPDATE TRONG PHASE A3

```
src/
├── app/
│   └── api/
│       └── usage/
│           └── route.ts           # NEW
├── components/
│   └── usage/
│       ├── UsageDashboard.tsx     # NEW
│       └── LimitReachedModal.tsx  # NEW
├── hooks/
│   └── useLimitModal.ts           # NEW
├── lib/
│   ├── features.ts                # NEW
│   └── stripe/
│       └── config.ts              # UPDATE với PLANS mới
├── middleware/
│   └── usageMiddleware.ts         # NEW
└── services/
    └── usageService.ts            # NEW

supabase/
└── migrations/
    └── 003_usage_tables.sql       # NEW
```

---

## TESTING CHECKLIST PHASE A3

```
### Usage Tracking
- [ ] usage_records table được tạo
- [ ] Usage increments on document upload
- [ ] Usage increments on query
- [ ] Usage decrements on document delete
- [ ] Pages tracked separately from documents

### Limit Enforcement
- [ ] FREE: 5 docs, 50 pages, 100 queries, 50MB
- [ ] STARTER: 50 docs, 500 pages, 1000 queries, 1GB
- [ ] PRO: 200 docs, 2000 pages, 5000 queries, 5GB
- [ ] BUSINESS: 1000 docs, 10000 pages, 20000 queries, 20GB
- [ ] Error response includes upgradeUrl

### UI Components
- [ ] Usage dashboard displays all 4 metrics
- [ ] Progress bars show accurate %
- [ ] Warning shown at 80% usage (yellow border)
- [ ] Limit modal appears when blocked
- [ ] Upgrade button redirects to /pricing

### Feature Gating
- [ ] FREE: Only naive mode
- [ ] STARTER+: All 5 modes, knowledge graph
- [ ] PRO+: API access, 3 team members
- [ ] BUSINESS: 10 team members, webhooks
```

---

## TIẾP THEO

Sau khi hoàn thành Phase A3:
→ **Phase A4: Landing Page & Polish**