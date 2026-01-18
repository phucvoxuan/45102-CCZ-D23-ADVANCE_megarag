// src/lib/media/durationChecker.ts
import { getPlanLimits, formatDuration, formatBytes, getUpgradeHint } from '@/lib/plans'

export interface DurationCheckResult {
  allowed: boolean
  durationSeconds: number
  limitSeconds: number
  durationFormatted: string
  limitFormatted: string
  error?: string
  upgradeHint?: string
}

export interface FileSizeCheckResult {
  allowed: boolean
  fileSize: number
  maxSize: number
  fileSizeFormatted: string
  maxSizeFormatted: string
  error?: string
  upgradeHint?: string
}

/**
 * Check if audio duration is within plan limits
 */
export function checkAudioDuration(
  durationSeconds: number,
  planName: string
): DurationCheckResult {
  const limits = getPlanLimits(planName)
  const allowed = durationSeconds <= limits.audioSeconds

  const result: DurationCheckResult = {
    allowed,
    durationSeconds,
    limitSeconds: limits.audioSeconds,
    durationFormatted: formatDuration(durationSeconds),
    limitFormatted: formatDuration(limits.audioSeconds),
  }

  if (!allowed) {
    result.error = `Audio duration ${result.durationFormatted} exceeds ${planName} plan limit (max ${result.limitFormatted})`
    result.upgradeHint = getUpgradeHint(planName, 'audio')
  }

  console.log('[DurationChecker] Audio check:', {
    planName,
    duration: result.durationFormatted,
    limit: result.limitFormatted,
    allowed,
  })

  return result
}

/**
 * Check if video duration is within plan limits
 */
export function checkVideoDuration(
  durationSeconds: number,
  planName: string
): DurationCheckResult {
  const limits = getPlanLimits(planName)
  const allowed = durationSeconds <= limits.videoSeconds

  const result: DurationCheckResult = {
    allowed,
    durationSeconds,
    limitSeconds: limits.videoSeconds,
    durationFormatted: formatDuration(durationSeconds),
    limitFormatted: formatDuration(limits.videoSeconds),
  }

  if (!allowed) {
    result.error = `Video duration ${result.durationFormatted} exceeds ${planName} plan limit (max ${result.limitFormatted})`
    result.upgradeHint = getUpgradeHint(planName, 'video')
  }

  console.log('[DurationChecker] Video check:', {
    planName,
    duration: result.durationFormatted,
    limit: result.limitFormatted,
    allowed,
  })

  return result
}

/**
 * Check if file size is within plan's max upload limit
 */
export function checkFileSize(
  fileSizeBytes: number,
  planName: string
): FileSizeCheckResult {
  const limits = getPlanLimits(planName)

  const allowed = fileSizeBytes <= limits.maxUploadBytes

  const result: FileSizeCheckResult = {
    allowed,
    fileSize: fileSizeBytes,
    maxSize: limits.maxUploadBytes,
    fileSizeFormatted: formatBytes(fileSizeBytes),
    maxSizeFormatted: formatBytes(limits.maxUploadBytes),
  }

  if (!allowed) {
    result.error = `File size ${result.fileSizeFormatted} exceeds ${planName} plan limit (max ${result.maxSizeFormatted})`
    result.upgradeHint = getUpgradeHint(planName, 'upload')
  }

  console.log('[DurationChecker] File size check:', {
    planName,
    fileSize: result.fileSizeFormatted,
    maxSize: result.maxSizeFormatted,
    allowed,
  })

  return result
}

/**
 * Parse duration from various formats
 * Supports: "5:30", "5m30s", "330", "5.5 minutes", etc.
 */
export function parseDuration(durationStr: string | number): number {
  if (typeof durationStr === 'number') {
    return Math.round(durationStr)
  }

  const str = durationStr.trim().toLowerCase()

  // Format: "5:30" or "1:23:45"
  if (str.includes(':')) {
    const parts = str.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }

  // Format: "5m30s" or "5m" or "30s"
  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*m/)
  const secMatch = str.match(/(\d+(?:\.\d+)?)\s*s/)
  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*h/)

  let totalSeconds = 0
  if (hourMatch) totalSeconds += parseFloat(hourMatch[1]) * 3600
  if (minMatch) totalSeconds += parseFloat(minMatch[1]) * 60
  if (secMatch) totalSeconds += parseFloat(secMatch[1])

  if (totalSeconds > 0) return Math.round(totalSeconds)

  // Format: "5.5 minutes" or "300 seconds"
  if (str.includes('minute')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''))
    return Math.round(num * 60)
  }
  if (str.includes('second')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''))
    return Math.round(num)
  }
  if (str.includes('hour')) {
    const num = parseFloat(str.replace(/[^\d.]/g, ''))
    return Math.round(num * 3600)
  }

  // Plain number (assume seconds)
  const num = parseFloat(str)
  return isNaN(num) ? 0 : Math.round(num)
}

/**
 * Extract duration from Gemini/LLM analysis text
 * Looks for patterns like "Duration: 5:30" or "5 minutes 30 seconds"
 */
export function extractDurationFromText(text: string): number {
  // Try to find duration mention in various formats

  // Pattern: "Duration: MM:SS" or "Length: HH:MM:SS"
  const colonMatch = text.match(/(?:duration|length|time)[:\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/i)
  if (colonMatch) {
    const parts = colonMatch.slice(1).filter(Boolean).map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }

  // Pattern: "X hours Y minutes Z seconds"
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hr)/i)
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|min)/i)
  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|sec)/i)

  let duration = 0
  if (hourMatch) duration += parseFloat(hourMatch[1]) * 3600
  if (minuteMatch) duration += parseFloat(minuteMatch[1]) * 60
  if (secondMatch) duration += parseFloat(secondMatch[1])

  if (duration > 0) return Math.round(duration)

  // Default to 5 minutes if not found (conservative estimate)
  return 300
}
