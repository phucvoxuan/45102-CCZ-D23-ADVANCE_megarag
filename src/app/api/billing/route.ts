import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { subscriptionService } from '@/services/subscriptionService';
import { usageService } from '@/services/usageService';
import { formatDuration } from '@/lib/plans';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile to find organization (use maybeSingle to avoid 406 error)
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    const organizationId = profile?.organization_id;

    // Get subscription
    const subscription = await subscriptionService.getSubscription({
      userId: user.id,
      organizationId,
    });

    // Get current usage - use user-based usage for individuals, org-based for organizations
    let usage = {
      documents: 0,
      pages: 0,
      queries: 0,
      storage: 0,
    };

    if (organizationId) {
      // Organization-based usage
      const rawUsage = await subscriptionService.getCurrentUsage(organizationId);
      usage = {
        documents: rawUsage.documents_count,
        pages: 0, // Organizations don't track pages separately
        queries: rawUsage.queries_count,
        storage: rawUsage.storage_bytes,
      };
    } else {
      // Individual user-based usage - filtered by user_id for data isolation
      // First sync actual usage from documents table to ensure accuracy
      try {
        await usageService.syncActualUsage(user.id);
      } catch (syncError) {
        console.error('Error syncing usage (continuing with cached data):', syncError);
      }

      const usageSummary = await usageService.getUsageSummary(user.id);
      usage = {
        documents: usageSummary.documents.current,
        pages: usageSummary.pages.current,
        queries: usageSummary.queries.current,
        storage: usageSummary.storage.current,
      };
    }

    // Get media usage (audio/video duration tracking)
    let mediaUsage = {
      audioUsage: {
        used: 0,
        limit: 0,
        remaining: 0,
        usedFormatted: '0:00',
        limitFormatted: '0:00',
        remainingFormatted: '0:00',
        percentage: 0,
      },
      videoUsage: {
        used: 0,
        limit: 0,
        remaining: 0,
        usedFormatted: '0:00',
        limitFormatted: '0:00',
        remainingFormatted: '0:00',
        percentage: 0,
      },
    };

    try {
      const mediaData = await usageService.getMediaUsage(user.id);
      mediaUsage = {
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
      };
    } catch (mediaError) {
      console.error('Error fetching media usage:', mediaError);
      // Continue with default values if media usage fetch fails
    }

    // Get invoices
    let invoices: any[] = [];
    if (organizationId) {
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      invoices = invoicesData || [];
    }

    return NextResponse.json({
      subscription,
      usage,
      mediaUsage,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}
