import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { usageService } from '@/services/usageService';
import { getAvailableQueryModes, getAvailableFeatures } from '@/lib/features';
import { formatDuration } from '@/lib/plans';
import { PLANS } from '@/lib/stripe/config';

/**
 * GET /api/usage - Get current user's usage summary
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Usage API] Starting request...');

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Usage API] Auth failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Usage API] User authenticated:', user.id);

    // Run usage summary, media usage, and widget stats queries in parallel for speed
    console.log('[Usage API] Fetching usage summary, media usage, and widget stats in parallel...');
    const [summary, mediaData, widgetStats] = await Promise.all([
      usageService.getUsageSummary(user.id),
      usageService.getMediaUsage(user.id).catch((err) => {
        console.error('Error fetching media usage:', err);
        return null; // Return null on error, will use defaults
      }),
      // Fetch widget stats using admin client to bypass RLS
      (async () => {
        try {
          // Get widget count
          const { count: widgetCount } = await supabaseAdmin
            .from('chatbot_widgets')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get all widgets with their stats
          const { data: widgets } = await supabaseAdmin
            .from('chatbot_widgets')
            .select('id, name, total_messages, total_conversations')
            .eq('user_id', user.id);

          const totalWidgetQueries = widgets?.reduce((sum, w) => sum + (w.total_messages || 0), 0) || 0;

          return {
            widgetCount: widgetCount || 0,
            totalWidgetQueries,
            widgets: widgets || [],
          };
        } catch (err) {
          console.error('Error fetching widget stats:', err);
          return { widgetCount: 0, totalWidgetQueries: 0, widgets: [] };
        }
      })(),
    ]);
    console.log('[Usage API] Data fetched successfully:', { planName: summary.planName, daysRemaining: summary.daysRemaining });

    // Get available features for the plan
    const availableQueryModes = getAvailableQueryModes(summary.planName);
    const availableFeatures = getAvailableFeatures(summary.planName);

    // Process media usage data
    const mediaUsage = mediaData ? {
      audioUsage: {
        used: mediaData.audioSecondsUsed,
        limit: mediaData.audioLimit,
        remaining: mediaData.audioRemaining,
        usedFormatted: formatDuration(mediaData.audioSecondsUsed),
        limitFormatted: formatDuration(mediaData.audioLimit),
        remainingFormatted: formatDuration(mediaData.audioRemaining),
        percentage: mediaData.audioLimit > 0
          ? Math.round((mediaData.audioSecondsUsed / mediaData.audioLimit) * 100)
          : 0,
      },
      videoUsage: {
        used: mediaData.videoSecondsUsed,
        limit: mediaData.videoLimit,
        remaining: mediaData.videoRemaining,
        usedFormatted: formatDuration(mediaData.videoSecondsUsed),
        limitFormatted: formatDuration(mediaData.videoLimit),
        remainingFormatted: formatDuration(mediaData.videoRemaining),
        percentage: mediaData.videoLimit > 0
          ? Math.round((mediaData.videoSecondsUsed / mediaData.videoLimit) * 100)
          : 0,
      },
    } : {
      audioUsage: { used: 0, limit: 0, remaining: 0, usedFormatted: '0:00', limitFormatted: '0:00', remainingFormatted: '0:00', percentage: 0 },
      videoUsage: { used: 0, limit: 0, remaining: 0, usedFormatted: '0:00', limitFormatted: '0:00', remainingFormatted: '0:00', percentage: 0 },
    }

    // Get widget limit based on plan
    const planName = summary.planName?.toUpperCase() || 'FREE';
    const widgetLimit = PLANS[planName as keyof typeof PLANS]?.limits?.documents
      ? (planName === 'FREE' ? 0 : planName === 'STARTER' ? 1 : planName === 'PRO' ? 5 : 100)
      : 0;

    // Calculate total queries including widget queries
    const totalQueries = summary.queries.current + widgetStats.totalWidgetQueries;

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        // Override queries to include widget queries in total
        queries: {
          ...summary.queries,
          current: totalQueries,
        },
        periodStart: summary.periodStart.toISOString(),
        periodEnd: summary.periodEnd.toISOString(),
        availableQueryModes,
        availableFeatures,
        mediaUsage,
        widgetUsage: {
          used: widgetStats.widgetCount,
          limit: widgetLimit,
          totalQueries: widgetStats.totalWidgetQueries,
          widgets: widgetStats.widgets,
        },
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usage/sync - Sync actual usage from documents table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sync actual usage with timeout (5 seconds should be enough with optimized queries)
    const syncPromise = usageService.syncActualUsage(user.id);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout after 5 seconds')), 5000)
    );

    try {
      await Promise.race([syncPromise, timeoutPromise]);
    } catch (syncError) {
      console.error('Usage sync error:', syncError);
      // Even if sync fails, return current data
      const summary = await usageService.getUsageSummary(user.id);
      return NextResponse.json({
        success: false,
        message: syncError instanceof Error ? syncError.message : 'Sync failed',
        data: {
          ...summary,
          periodStart: summary.periodStart.toISOString(),
          periodEnd: summary.periodEnd.toISOString(),
        },
      });
    }

    // Return updated summary
    const summary = await usageService.getUsageSummary(user.id);

    return NextResponse.json({
      success: true,
      message: 'Usage synced successfully',
      data: {
        ...summary,
        periodStart: summary.periodStart.toISOString(),
        periodEnd: summary.periodEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('Usage sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync usage' },
      { status: 500 }
    );
  }
}
