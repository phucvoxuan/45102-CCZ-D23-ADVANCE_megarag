// src/app/api/upload/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/auth-server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getPlanLimits, formatBytes, formatDuration, getUpgradeHint } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', valid: false }, { status: 401 })
    }

    // 2. Get validation params from request
    const {
      fileName,
      fileSize,
      mediaType,      // 'audio' | 'video' | null
      durationSeconds // Duration extracted from client
    } = await request.json()

    // 3. Get user's plan
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .single()

    const planName = subscription?.plan_name || 'FREE'
    const limits = getPlanLimits(planName)

    console.log('[Upload Validate] Request:', {
      userId: user.id,
      planName,
      fileName,
      fileSize: formatBytes(fileSize),
      mediaType,
      durationSeconds,
    })

    // 4. Check file size
    if (fileSize > limits.maxUploadBytes) {
      return NextResponse.json({
        valid: false,
        error: `File too large (${formatBytes(fileSize)}). ${planName} plan limit is ${formatBytes(limits.maxUploadBytes)}`,
        code: 'FILE_TOO_LARGE',
        fileSize,
        maxSize: limits.maxUploadBytes,
        upgradeHint: getUpgradeHint(planName, 'upload'),
      }, { status: 400 })
    }

    // 5. Check duration for audio/video
    if (mediaType && durationSeconds && durationSeconds > 0) {
      const durationLimit = mediaType === 'audio' ? limits.audioSeconds : limits.videoSeconds

      // Check single file duration
      if (durationSeconds > durationLimit) {
        return NextResponse.json({
          valid: false,
          error: `${mediaType === 'audio' ? 'Audio' : 'Video'} duration ${formatDuration(durationSeconds)} exceeds ${planName} plan limit (max ${formatDuration(durationLimit)})`,
          code: mediaType === 'audio' ? 'AUDIO_TOO_LONG' : 'VIDEO_TOO_LONG',
          duration: durationSeconds,
          limit: durationLimit,
          durationFormatted: formatDuration(durationSeconds),
          limitFormatted: formatDuration(durationLimit),
          upgradeHint: getUpgradeHint(planName, mediaType),
        }, { status: 400 })
      }

      // Check cumulative duration - query by user_id (matching usageService)
      const { data: usage } = await supabaseAdmin
        .from('usage_records')
        .select('audio_seconds_used, video_seconds_used')
        .eq('user_id', user.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (usage) {
        const currentUsed = mediaType === 'audio'
          ? (usage.audio_seconds_used || 0)
          : (usage.video_seconds_used || 0)

        const totalAfterUpload = currentUsed + durationSeconds

        if (totalAfterUpload > durationLimit) {
          const remaining = Math.max(0, durationLimit - currentUsed)
          return NextResponse.json({
            valid: false,
            error: `You have used ${formatDuration(currentUsed)}/${formatDuration(durationLimit)} ${mediaType}. This file (${formatDuration(durationSeconds)}) would exceed your limit. Remaining: ${formatDuration(remaining)}`,
            code: mediaType === 'audio' ? 'AUDIO_QUOTA_EXCEEDED' : 'VIDEO_QUOTA_EXCEEDED',
            currentUsed,
            limit: durationLimit,
            remaining,
            upgradeHint: getUpgradeHint(planName, mediaType),
          }, { status: 400 })
        }
      }
    }

    // 6. All checks passed
    return NextResponse.json({
      valid: true,
      planName,
      limits: {
        maxUploadBytes: limits.maxUploadBytes,
        maxUploadFormatted: formatBytes(limits.maxUploadBytes),
        audioSeconds: limits.audioSeconds,
        audioFormatted: formatDuration(limits.audioSeconds),
        videoSeconds: limits.videoSeconds,
        videoFormatted: formatDuration(limits.videoSeconds),
      },
    })

  } catch (error) {
    console.error('[Upload Validate] Error:', error)
    return NextResponse.json(
      { error: 'Validation failed', valid: false },
      { status: 500 }
    )
  }
}
