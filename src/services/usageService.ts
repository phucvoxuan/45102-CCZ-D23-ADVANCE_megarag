import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  USAGE_PLAN_LIMITS,
  getPlanLimits as getFullPlanLimits,
  getBasePlanName,
  formatBytes,
  formatDuration,
  getUpgradeHint,
  type BasePlanName,
  type PlanLimits as FullPlanLimits,
} from '@/lib/plans';

// Re-export PLAN_LIMITS for backward compatibility (uses USAGE_PLAN_LIMITS from lib/plans)
export const PLAN_LIMITS = USAGE_PLAN_LIMITS;

export type PlanName = keyof typeof PLAN_LIMITS;

export interface UsageRecord {
  documentsCount: number;
  pagesCount: number;
  queriesCount: number;
  storageBytes: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface UsageLimits {
  documents: number;
  pages: number;
  queries: number;
  storage: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  warningThreshold: boolean; // true if >= 80%
  message?: string;
}

export class UsageService {
  // Get current billing period for user
  async getCurrentPeriod(userId: string): Promise<{ start: Date; end: Date; billingCycle: string }> {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('current_period_start, current_period_end, billing_cycle')
      .eq('user_id', userId)
      .maybeSingle();  // Use maybeSingle to avoid 406 error when no subscription

    if (subscription?.current_period_start && subscription?.current_period_end) {
      const start = new Date(subscription.current_period_start);
      let end = new Date(subscription.current_period_end);
      const billingCycle = subscription.billing_cycle || 'monthly';

      // Validate: For yearly plans, period should be ~365 days
      // If period is less than 60 days but billing_cycle is yearly, recalculate
      if (billingCycle === 'yearly') {
        const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (periodDays < 60) {
          // Period seems wrong for yearly, recalculate from start date
          end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
        }
      }

      return { start, end, billingCycle };
    }

    // Default to current month for free tier
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      billingCycle: 'monthly',
    };
  }

  // Get or create usage record for current period
  async getOrCreateUsageRecord(userId: string): Promise<UsageRecord> {
    const period = await this.getCurrentPeriod(userId);

    // Try to get the most recent usage record for this user
    // Use a simpler query that gets the latest record in the current month
    const { data: usage } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if the record is for the current period
    const recordMatchesPeriod = usage &&
      new Date(usage.period_start) <= period.end &&
      new Date(usage.period_end) >= period.start;

    if (!usage || !recordMatchesPeriod) {
      // Create new record for this period
      const { data: newUsage, error } = await supabaseAdmin
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
        .single();

      if (error) {
        console.error('Error creating usage record:', error);
        // Return default values if insert fails
        return {
          documentsCount: 0,
          pagesCount: 0,
          queriesCount: 0,
          storageBytes: 0,
          periodStart: period.start,
          periodEnd: period.end,
        };
      }

      return {
        documentsCount: newUsage?.documents_count || 0,
        pagesCount: newUsage?.pages_count || 0,
        queriesCount: newUsage?.queries_count || 0,
        storageBytes: newUsage?.storage_bytes || 0,
        periodStart: period.start,
        periodEnd: period.end,
      };
    }

    return {
      documentsCount: usage.documents_count || 0,
      pagesCount: usage.pages_count || 0,
      queriesCount: usage.queries_count || 0,
      storageBytes: usage.storage_bytes || 0,
      periodStart: new Date(usage.period_start),
      periodEnd: new Date(usage.period_end),
    };
  }

  // Get plan limits for user
  async getPlanLimits(userId: string): Promise<UsageLimits> {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .maybeSingle();  // Use maybeSingle to avoid 406 error when no subscription

    const planName = (subscription?.plan_name?.toUpperCase() || 'FREE') as PlanName;
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.FREE;

    return limits;
  }

  // Get plan name for user
  async getPlanName(userId: string): Promise<string> {
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .maybeSingle();  // Use maybeSingle to avoid 406 error when no subscription

    return subscription?.plan_name || 'FREE';
  }

  // Check if action is allowed
  async checkLimit(
    userId: string,
    type: 'documents' | 'pages' | 'queries' | 'storage',
    additionalAmount: number = 1
  ): Promise<UsageCheckResult> {
    const usage = await this.getOrCreateUsageRecord(userId);
    const limits = await this.getPlanLimits(userId);

    const currentMap = {
      documents: usage.documentsCount,
      pages: usage.pagesCount,
      queries: usage.queriesCount,
      storage: usage.storageBytes,
    };

    const limitMap = {
      documents: limits.documents,
      pages: limits.pages,
      queries: limits.queries,
      storage: limits.storage,
    };

    const current = currentMap[type];
    const limit = limitMap[type];
    const afterAction = current + additionalAmount;
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    const allowed = afterAction <= limit;

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
    };
  }

  // Increment usage
  async incrementUsage(
    userId: string,
    type: 'documents' | 'pages' | 'queries' | 'storage',
    amount: number = 1
  ): Promise<void> {
    const period = await this.getCurrentPeriod(userId);

    const columnMap = {
      documents: 'documents_count',
      pages: 'pages_count',
      queries: 'queries_count',
      storage: 'storage_bytes',
    };

    // First ensure record exists
    await this.getOrCreateUsageRecord(userId);

    // Then increment using RPC function
    const { error } = await supabaseAdmin.rpc('increment_usage', {
      p_user_id: userId,
      p_period_start: period.start.toISOString(),
      p_column: columnMap[type],
      p_amount: amount,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      // Fallback to direct update
      await this.directUpdateUsage(userId, type, amount, 'increment');
    }
  }

  // Decrement usage (for document deletion)
  async decrementUsage(
    userId: string,
    type: 'documents' | 'pages' | 'storage',
    amount: number = 1
  ): Promise<void> {
    const period = await this.getCurrentPeriod(userId);

    const columnMap = {
      documents: 'documents_count',
      pages: 'pages_count',
      storage: 'storage_bytes',
    };

    const { error } = await supabaseAdmin.rpc('decrement_usage', {
      p_user_id: userId,
      p_period_start: period.start.toISOString(),
      p_column: columnMap[type],
      p_amount: amount,
    });

    if (error) {
      console.error('Error decrementing usage:', error);
      // Fallback to direct update
      await this.directUpdateUsage(userId, type, amount, 'decrement');
    }
  }

  // Direct update fallback
  private async directUpdateUsage(
    userId: string,
    type: 'documents' | 'pages' | 'queries' | 'storage',
    amount: number,
    operation: 'increment' | 'decrement'
  ): Promise<void> {
    const period = await this.getCurrentPeriod(userId);

    const columnMap: Record<string, string> = {
      documents: 'documents_count',
      pages: 'pages_count',
      queries: 'queries_count',
      storage: 'storage_bytes',
    };

    const column = columnMap[type];

    // Get current value
    const { data: existing } = await supabaseAdmin
      .from('usage_records')
      .select(column)
      .eq('user_id', userId)
      .gte('period_start', period.start.toISOString())
      .lte('period_start', period.end.toISOString())
      .single();

    if (existing) {
      const currentValue = (existing as unknown as Record<string, number>)[column] || 0;
      const newValue = operation === 'increment'
        ? currentValue + amount
        : Math.max(0, currentValue - amount);

      await supabaseAdmin
        .from('usage_records')
        .update({
          [column]: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .gte('period_start', period.start.toISOString())
        .lte('period_start', period.end.toISOString());
    }
  }

  // Get usage summary for dashboard - optimized with parallel queries
  async getUsageSummary(userId: string): Promise<{
    documents: UsageCheckResult;
    pages: UsageCheckResult;
    queries: UsageCheckResult;
    storage: UsageCheckResult;
    periodStart: Date;
    periodEnd: Date;
    daysRemaining: number;
    planName: string;
    billingCycle: string;
  }> {
    // Run usage record fetch and subscription fetch in parallel for speed
    const [usage, subscription] = await Promise.all([
      this.getOrCreateUsageRecord(userId),
      supabaseAdmin
        .from('subscriptions')
        .select('plan_name, billing_cycle, current_period_start, current_period_end')
        .eq('user_id', userId)
        .maybeSingle()
    ]);

    const planName = (subscription?.data?.plan_name?.toUpperCase() || 'FREE') as PlanName;
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.FREE;
    const billingCycle = subscription?.data?.billing_cycle || 'monthly';

    // Use subscription period if available (more accurate for billing display)
    // Subscription has the correct billing period from payment provider
    let periodStart = usage.periodStart;
    let periodEnd = usage.periodEnd;

    if (subscription?.data?.current_period_start && subscription?.data?.current_period_end) {
      periodStart = new Date(subscription.data.current_period_start);
      periodEnd = new Date(subscription.data.current_period_end);

      // Validate: For yearly plans, period should be ~365 days
      // If period is less than 60 days but billing_cycle is yearly, recalculate
      if (billingCycle === 'yearly') {
        const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        if (periodDays < 60) {
          // Period seems wrong for yearly, recalculate from start date
          periodEnd = new Date(periodStart);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          console.log(`[UsageService] Corrected yearly period from ${periodDays} days to 365 days`);
        }
      }
    }

    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const createResult = (current: number, limit: number): UsageCheckResult => ({
      allowed: current < limit,
      current,
      limit,
      percentage: limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0,
      warningThreshold: limit > 0 ? current >= limit * 0.8 : false,
    });

    return {
      documents: createResult(usage.documentsCount, limits.documents),
      pages: createResult(usage.pagesCount, limits.pages),
      queries: createResult(usage.queriesCount, limits.queries),
      storage: createResult(usage.storageBytes, limits.storage),
      periodStart,
      periodEnd,
      daysRemaining,
      planName: subscription?.data?.plan_name || 'FREE',
      billingCycle,
    };
  }

  // Reset usage for new period (called by webhook)
  async resetUsage(userId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    await supabaseAdmin.from('usage_records').insert({
      user_id: userId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      documents_count: 0,
      pages_count: 0,
      queries_count: 0,
      storage_bytes: 0,
    });
  }

  // Increment token usage (for LLM cost tracking)
  async incrementTokenUsage(
    userId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    if (inputTokens === 0 && outputTokens === 0) return;

    console.log('[UsageService] incrementTokenUsage called:', { userId, inputTokens, outputTokens });

    const period = await this.getCurrentPeriod(userId);

    // Try RPC function first (atomic operation)
    const { error } = await supabaseAdmin.rpc('increment_token_usage', {
      p_user_id: userId,
      p_period_start: period.start.toISOString(),
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
    });

    if (error) {
      console.error('[UsageService] RPC increment_token_usage failed:', error.message);
      // Fallback to direct update
      await this.directUpdateTokenUsage(userId, inputTokens, outputTokens);
    } else {
      console.log('[UsageService] Token usage incremented via RPC:', { userId, inputTokens, outputTokens });
    }
  }

  // Direct update fallback for token usage
  private async directUpdateTokenUsage(
    userId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    console.log('[UsageService] directUpdateTokenUsage called:', { userId, inputTokens, outputTokens });

    // Get existing usage record for this user (most recent)
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('usage_records')
      .select('id, tokens_input, tokens_output, period_start')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('[UsageService] Existing record:', existing, 'Error:', selectError?.message);

    if (existing) {
      // Update existing record by ID (most reliable)
      const newInputTokens = (existing.tokens_input || 0) + inputTokens;
      const newOutputTokens = (existing.tokens_output || 0) + outputTokens;

      console.log('[UsageService] Updating record:', {
        id: existing.id,
        oldInput: existing.tokens_input,
        oldOutput: existing.tokens_output,
        newInput: newInputTokens,
        newOutput: newOutputTokens,
      });

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('usage_records')
        .update({
          tokens_input: newInputTokens,
          tokens_output: newOutputTokens,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select();

      if (updateError) {
        console.error('[UsageService] Update FAILED:', updateError.message);
      } else {
        console.log('[UsageService] Update SUCCESS:', updateData);
      }
    } else {
      // Create new record with token usage
      const period = await this.getCurrentPeriod(userId);

      console.log('[UsageService] Creating new record with tokens');

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('usage_records')
        .insert({
          user_id: userId,
          period_start: period.start.toISOString(),
          period_end: period.end.toISOString(),
          documents_count: 0,
          pages_count: 0,
          queries_count: 0,
          storage_bytes: 0,
          tokens_input: inputTokens,
          tokens_output: outputTokens,
        })
        .select();

      if (insertError) {
        console.error('[UsageService] Insert FAILED:', insertError.message);
      } else {
        console.log('[UsageService] Insert SUCCESS:', insertData);
      }
    }
  }

  // Get token usage for a user (for admin dashboard)
  async getTokenUsage(userId: string): Promise<{ input: number; output: number; total: number }> {
    // Get most recent usage record for user (simpler and more reliable)
    const { data } = await supabaseAdmin
      .from('usage_records')
      .select('tokens_input, tokens_output')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    const input = (data as Record<string, number> | null)?.tokens_input || 0;
    const output = (data as Record<string, number> | null)?.tokens_output || 0;

    console.log('[UsageService] getTokenUsage:', { userId, input, output });

    return {
      input,
      output,
      total: input + output,
    };
  }

  // Sync actual usage from documents table (for accuracy) - optimized for speed
  async syncActualUsage(userId: string): Promise<void> {
    console.log('[UsageService] Syncing usage for user:', userId);

    try {
      // Run all data fetches in parallel for speed
      const [docStatsResult, chunksCountResult, sessionsResult, periodResult] = await Promise.all([
        // Get document stats
        supabaseAdmin
          .from('documents')
          .select('id, file_size, page_count, chunks_count')
          .eq('user_id', userId),
        // CRITICAL: Get actual chunks count from document_chunks table (chunks = pages)
        supabaseAdmin
          .from('document_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Get session IDs for this user
        supabaseAdmin
          .from('chat_sessions')
          .select('id')
          .eq('user_id', userId),
        // Get current period
        this.getCurrentPeriod(userId)
      ]);

      const docStats = docStatsResult.data;
      const sessions = sessionsResult.data;
      const period = periodResult;

      if (docStatsResult.error) {
        console.error('[UsageService] Error fetching documents:', docStatsResult.error);
        throw docStatsResult.error;
      }

      const actualDocCount = docStats?.length || 0;
      const actualStorageBytes = docStats?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
      // Use actual chunks count from document_chunks table (chunks = pages for billing)
      const actualPageCount = chunksCountResult.count || 0;

      console.log('[UsageService] Chunks count from document_chunks table:', actualPageCount);

      // Get query count only if there are sessions
      let queryCount = 0;
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        const { count } = await supabaseAdmin
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'user')
          .in('session_id', sessionIds);
        queryCount = count || 0;
      }

      console.log('[UsageService] Stats:', {
        documents: actualDocCount,
        storage: actualStorageBytes,
        pages: actualPageCount,
        queries: queryCount,
      });

      // Get existing usage record
      const { data: existingRecord } = await supabaseAdmin
        .from('usage_records')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingRecord) {
        // Create new record
        const { error: insertError } = await supabaseAdmin
          .from('usage_records')
          .insert({
            user_id: userId,
            period_start: period.start.toISOString(),
            period_end: period.end.toISOString(),
            documents_count: actualDocCount,
            storage_bytes: actualStorageBytes,
            pages_count: actualPageCount,
            queries_count: queryCount,
          });

        if (insertError) {
          console.error('[UsageService] Error inserting usage record:', insertError);
          throw insertError;
        }
      } else {
        // Update existing record by ID (faster than date range query)
        const { error: updateError } = await supabaseAdmin
          .from('usage_records')
          .update({
            documents_count: actualDocCount,
            storage_bytes: actualStorageBytes,
            pages_count: actualPageCount,
            queries_count: queryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('[UsageService] Error updating usage record:', updateError);
          throw updateError;
        }
      }

      console.log('[UsageService] Sync completed successfully');
    } catch (error) {
      console.error('[UsageService] Sync failed:', error);
      throw error;
    }
  }

  // Get full plan limits including media duration (from lib/plans)
  async getFullPlanLimits(userId: string): Promise<FullPlanLimits> {
    const planName = await this.getPlanName(userId);
    return getFullPlanLimits(planName);
  }

  // Check if user can upload media with given duration
  async checkMediaDuration(
    userId: string,
    mediaType: 'audio' | 'video',
    durationSeconds: number
  ): Promise<{
    allowed: boolean;
    durationSeconds: number;
    limitSeconds: number;
    durationFormatted: string;
    limitFormatted: string;
    error?: string;
    upgradeHint?: string;
  }> {
    const planName = await this.getPlanName(userId);
    const limits = getFullPlanLimits(planName);
    const limitSeconds = mediaType === 'audio' ? limits.audioSeconds : limits.videoSeconds;

    const allowed = durationSeconds <= limitSeconds;

    const result = {
      allowed,
      durationSeconds,
      limitSeconds,
      durationFormatted: formatDuration(durationSeconds),
      limitFormatted: formatDuration(limitSeconds),
      error: undefined as string | undefined,
      upgradeHint: undefined as string | undefined,
    };

    if (!allowed) {
      result.error = `${mediaType === 'audio' ? 'Audio' : 'Video'} duration ${result.durationFormatted} exceeds ${planName} plan limit (max ${result.limitFormatted})`;
      result.upgradeHint = getUpgradeHint(planName, mediaType);
    }

    console.log('[UsageService] Media duration check:', {
      userId,
      mediaType,
      duration: result.durationFormatted,
      limit: result.limitFormatted,
      allowed,
    });

    return result;
  }

  // Check if user can upload file with given size
  async checkUploadFileSize(
    userId: string,
    fileSizeBytes: number
  ): Promise<{
    allowed: boolean;
    fileSize: number;
    maxSize: number;
    fileSizeFormatted: string;
    maxSizeFormatted: string;
    error?: string;
    upgradeHint?: string;
  }> {
    const planName = await this.getPlanName(userId);
    const limits = getFullPlanLimits(planName);
    const allowed = fileSizeBytes <= limits.maxUploadBytes;

    const result = {
      allowed,
      fileSize: fileSizeBytes,
      maxSize: limits.maxUploadBytes,
      fileSizeFormatted: formatBytes(fileSizeBytes),
      maxSizeFormatted: formatBytes(limits.maxUploadBytes),
      error: undefined as string | undefined,
      upgradeHint: undefined as string | undefined,
    };

    if (!allowed) {
      result.error = `File size ${result.fileSizeFormatted} exceeds ${planName} plan limit (max ${result.maxSizeFormatted})`;
      result.upgradeHint = getUpgradeHint(planName, 'upload');
    }

    console.log('[UsageService] File size check:', {
      userId,
      fileSize: result.fileSizeFormatted,
      maxSize: result.maxSizeFormatted,
      allowed,
    });

    return result;
  }

  /**
   * Get current media duration usage for user
   */
  async getMediaUsage(userId: string): Promise<{
    audioSecondsUsed: number;
    videoSecondsUsed: number;
    audioLimit: number;
    videoLimit: number;
    audioRemaining: number;
    videoRemaining: number;
  }> {
    try {
      let audioUsed = 0;
      let videoUsed = 0;

      // Direct query to usage_records (RPC not available yet)
      const { data: usage, error: queryError } = await supabaseAdmin
        .from('usage_records')
        .select('audio_seconds_used, video_seconds_used')
        .eq('user_id', userId)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.log('[UsageService] getMediaUsage query error:', queryError.message);
      } else if (usage) {
        audioUsed = usage.audio_seconds_used || 0;
        videoUsed = usage.video_seconds_used || 0;
      } else {
        console.log('[UsageService] No usage record found for user:', userId);
      }

      // Get plan limits
      const limits = await this.getFullPlanLimits(userId);

      const result = {
        audioSecondsUsed: audioUsed,
        videoSecondsUsed: videoUsed,
        audioLimit: limits.audioSeconds,
        videoLimit: limits.videoSeconds,
        audioRemaining: Math.max(0, limits.audioSeconds - audioUsed),
        videoRemaining: Math.max(0, limits.videoSeconds - videoUsed),
      };

      console.log('[UsageService] getMediaUsage:', {
        userId,
        audio: `${formatDuration(result.audioSecondsUsed)} / ${formatDuration(result.audioLimit)}`,
        video: `${formatDuration(result.videoSecondsUsed)} / ${formatDuration(result.videoLimit)}`,
      });

      return result;
    } catch (error) {
      console.error('[UsageService] getMediaUsage error:', error);
      const defaultLimits = getFullPlanLimits('FREE');
      return {
        audioSecondsUsed: 0,
        videoSecondsUsed: 0,
        audioLimit: defaultLimits.audioSeconds,
        videoLimit: defaultLimits.videoSeconds,
        audioRemaining: defaultLimits.audioSeconds,
        videoRemaining: defaultLimits.videoSeconds,
      };
    }
  }

  /**
   * Increment media duration usage
   */
  async incrementMediaDuration(
    userId: string,
    mediaType: 'audio' | 'video',
    seconds: number
  ): Promise<boolean> {
    try {
      console.log('[UsageService] incrementMediaDuration:', { userId, mediaType, seconds });

      const column = mediaType === 'audio' ? 'audio_seconds_used' : 'video_seconds_used';

      // Get current usage record
      const { data: current, error: selectError } = await supabaseAdmin
        .from('usage_records')
        .select(`id, ${column}`)
        .eq('user_id', userId)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error('[UsageService] Failed to get usage record:', selectError);
        return false;
      }

      if (!current) {
        console.log('[UsageService] No usage record found, creating one first');
        // Ensure usage record exists
        await this.getOrCreateUsageRecord(userId);

        // Try again
        const { data: newCurrent } = await supabaseAdmin
          .from('usage_records')
          .select(`id, ${column}`)
          .eq('user_id', userId)
          .order('period_start', { ascending: false })
          .limit(1)
          .single();

        if (!newCurrent) {
          console.error('[UsageService] Still no usage record after creation');
          return false;
        }

        const currentValue = (newCurrent as Record<string, number>)[column] || 0;
        const { error: updateError } = await supabaseAdmin
          .from('usage_records')
          .update({
            [column]: currentValue + seconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', newCurrent.id);

        if (updateError) {
          console.error('[UsageService] Update failed:', updateError);
          return false;
        }
      } else {
        const currentValue = (current as Record<string, number>)[column] || 0;
        const { error: updateError } = await supabaseAdmin
          .from('usage_records')
          .update({
            [column]: currentValue + seconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id);

        if (updateError) {
          console.error('[UsageService] Update failed:', updateError);
          return false;
        }
      }

      console.log('[UsageService] Media duration incremented successfully');
      return true;
    } catch (error) {
      console.error('[UsageService] incrementMediaDuration error:', error);
      return false;
    }
  }

  /**
   * Check if user can upload media with given duration (single file + cumulative)
   */
  async canUploadMedia(
    userId: string,
    mediaType: 'audio' | 'video',
    durationSeconds: number
  ): Promise<{
    allowed: boolean;
    reason?: 'single_file_too_long' | 'quota_exceeded';
    currentUsed: number;
    limit: number;
    remaining: number;
    error?: string;
    upgradeHint?: string;
  }> {
    const mediaUsage = await this.getMediaUsage(userId);

    const currentUsed = mediaType === 'audio' ? mediaUsage.audioSecondsUsed : mediaUsage.videoSecondsUsed;
    const limit = mediaType === 'audio' ? mediaUsage.audioLimit : mediaUsage.videoLimit;
    const remaining = mediaType === 'audio' ? mediaUsage.audioRemaining : mediaUsage.videoRemaining;

    // Get plan name for upgrade hint
    const planName = await this.getPlanName(userId);

    // Check 1: Single file duration vs plan limit
    if (durationSeconds > limit) {
      return {
        allowed: false,
        reason: 'single_file_too_long',
        currentUsed,
        limit,
        remaining,
        error: `${mediaType === 'audio' ? 'Audio' : 'Video'} duration ${formatDuration(durationSeconds)} exceeds ${planName} plan limit (max ${formatDuration(limit)} per file)`,
        upgradeHint: getUpgradeHint(planName, mediaType),
      };
    }

    // Check 2: Cumulative usage
    if (durationSeconds > remaining) {
      return {
        allowed: false,
        reason: 'quota_exceeded',
        currentUsed,
        limit,
        remaining,
        error: `You have used ${formatDuration(currentUsed)} / ${formatDuration(limit)} ${mediaType}. This file (${formatDuration(durationSeconds)}) exceeds remaining quota (${formatDuration(remaining)})`,
        upgradeHint: getUpgradeHint(planName, mediaType),
      };
    }

    return {
      allowed: true,
      currentUsed,
      limit,
      remaining,
    };
  }
}

// Export singleton instance
export const usageService = new UsageService();
