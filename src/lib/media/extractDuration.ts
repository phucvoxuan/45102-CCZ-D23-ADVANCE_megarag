// src/lib/media/extractDuration.ts
// Extract duration from audio/video files using Web APIs

/**
 * Extract duration from media file on client-side using HTML5 media element
 * This runs in browser before upload
 */
export async function extractDurationClient(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const mediaType = file.type.startsWith('audio/') ? 'audio' : 'video'
    const element = document.createElement(mediaType)

    element.preload = 'metadata'

    element.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      const duration = element.duration
      if (isFinite(duration) && duration > 0) {
        resolve(Math.ceil(duration))
      } else {
        resolve(null)
      }
    }

    element.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve(null)
    }, 10000)

    element.src = url
  })
}

/**
 * Check if file is audio or video based on extension and MIME type
 */
export function getMediaType(file: File): 'audio' | 'video' | null {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()

  const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma']
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv']

  if (mimeType.startsWith('audio/') || audioExtensions.some(ext => fileName.endsWith(ext))) {
    return 'audio'
  }

  if (mimeType.startsWith('video/') || videoExtensions.some(ext => fileName.endsWith(ext))) {
    return 'video'
  }

  return null
}

/**
 * Format duration for display
 */
export function formatDurationDisplay(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} giây`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) {
    return secs > 0 ? `${mins} phút ${secs} giây` : `${mins} phút`
  }
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours} giờ ${remainingMins} phút` : `${hours} giờ`
}
