// src/lib/plans.ts
// SINGLE SOURCE OF TRUTH cho tất cả subscription limits
// Dùng chung cho cả Stripe và Payhip payment methods

export type PlanName = 'FREE' | 'STARTER' | 'STARTER_YEARLY' | 'PRO' | 'PRO_YEARLY' | 'BUSINESS' | 'BUSINESS_YEARLY'

export type BasePlanName = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'

export interface PlanLimits {
  // Documents & Storage
  documents: number
  pages: number
  queries: number
  storageBytes: number
  maxUploadBytes: number  // Max file size per upload

  // Media Duration (in seconds)
  audioSeconds: number
  videoSeconds: number

  // Widget limits
  widgets: number  // Number of chatbot widgets allowed

  // Features
  ragModes: number
  knowledgeGraph: boolean
  apiAccess: boolean
  teamMembers: number
}

export interface PlanPricing {
  monthly: number  // USD
  yearly: number   // USD
  monthlyVND: number
  yearlyVND: number
}

// Base limits cho mỗi tier (không phân biệt monthly/yearly)
export const PLAN_LIMITS: Record<BasePlanName, PlanLimits> = {
  FREE: {
    documents: 5,
    pages: 50,
    queries: 100,
    storageBytes: 50 * 1024 * 1024,        // 50MB
    maxUploadBytes: 25 * 1024 * 1024,       // 25MB per file
    audioSeconds: 5 * 60,                   // 5 minutes = 300 seconds
    videoSeconds: 1 * 60,                   // 1 minute = 60 seconds
    widgets: 0,                             // FREE: No widgets
    ragModes: 1,
    knowledgeGraph: false,
    apiAccess: false,
    teamMembers: 0,
  },
  STARTER: {
    documents: 50,
    pages: 500,
    queries: 1000,
    storageBytes: 1 * 1024 * 1024 * 1024,   // 1GB
    maxUploadBytes: 200 * 1024 * 1024,      // 200MB per file
    audioSeconds: 60 * 60,                  // 60 minutes = 3600 seconds
    videoSeconds: 10 * 60,                  // 10 minutes = 600 seconds
    widgets: 1,                             // STARTER: 1 widget
    ragModes: 5,
    knowledgeGraph: true,
    apiAccess: false,
    teamMembers: 0,
  },
  PRO: {
    documents: 200,
    pages: 2000,
    queries: 5000,
    storageBytes: 5 * 1024 * 1024 * 1024,   // 5GB
    maxUploadBytes: 500 * 1024 * 1024,      // 500MB per file
    audioSeconds: 300 * 60,                 // 300 minutes = 18000 seconds
    videoSeconds: 60 * 60,                  // 60 minutes = 3600 seconds
    widgets: 5,                             // PRO: 5 widgets
    ragModes: 5,
    knowledgeGraph: true,
    apiAccess: true,
    teamMembers: 3,
  },
  BUSINESS: {
    documents: 1000,
    pages: 10000,
    queries: 20000,
    storageBytes: 20 * 1024 * 1024 * 1024,  // 20GB
    maxUploadBytes: 1 * 1024 * 1024 * 1024, // 1GB per file
    audioSeconds: 1000 * 60,                // 1000 minutes = 60000 seconds
    videoSeconds: 300 * 60,                 // 300 minutes = 18000 seconds
    widgets: 100,                           // BUSINESS: Unlimited (100 for display)
    ragModes: 5,
    knowledgeGraph: true,
    apiAccess: true,
    teamMembers: 10,
  },
}

// Pricing (USD và VND)
export const PLAN_PRICING: Record<BasePlanName, PlanPricing> = {
  FREE: {
    monthly: 0,
    yearly: 0,
    monthlyVND: 0,
    yearlyVND: 0,
  },
  STARTER: {
    monthly: 29,
    yearly: 290,  // ~17% discount
    monthlyVND: 699000,
    yearlyVND: 6990000,
  },
  PRO: {
    monthly: 99,
    yearly: 990,
    monthlyVND: 2400000,
    yearlyVND: 24000000,
  },
  BUSINESS: {
    monthly: 299,
    yearly: 2990,
    monthlyVND: 7200000,
    yearlyVND: 72000000,
  },
}

// Helper: Get base plan name (remove _YEARLY suffix)
export function getBasePlanName(planName: string): BasePlanName {
  const baseName = planName.toUpperCase().replace('_YEARLY', '').replace('_MONTHLY', '')
  if (baseName in PLAN_LIMITS) {
    return baseName as BasePlanName
  }
  return 'FREE'
}

// Helper: Get plan limits (works with any plan name variant)
export function getPlanLimits(planName: string): PlanLimits {
  const baseName = getBasePlanName(planName)
  return PLAN_LIMITS[baseName]
}

// Helper: Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Helper: Format duration to human readable
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Helper: Get upgrade hint based on current plan
export function getUpgradeHint(currentPlan: string, limitType: 'audio' | 'video' | 'upload' | 'storage'): string {
  const basePlan = getBasePlanName(currentPlan)

  const hints: Record<BasePlanName, Record<string, string>> = {
    FREE: {
      audio: 'Upgrade to STARTER for 60 min audio',
      video: 'Upgrade to STARTER for 10 min video',
      upload: 'Upgrade to STARTER for 200MB max file size',
      storage: 'Upgrade to STARTER for 1GB storage',
    },
    STARTER: {
      audio: 'Upgrade to PRO for 300 min audio',
      video: 'Upgrade to PRO for 60 min video',
      upload: 'Upgrade to PRO for 500MB max file size',
      storage: 'Upgrade to PRO for 5GB storage',
    },
    PRO: {
      audio: 'Upgrade to BUSINESS for 1000 min audio',
      video: 'Upgrade to BUSINESS for 300 min video',
      upload: 'Upgrade to BUSINESS for 1GB max file size',
      storage: 'Upgrade to BUSINESS for 20GB storage',
    },
    BUSINESS: {
      audio: 'Contact sales to increase limits',
      video: 'Contact sales to increase limits',
      upload: 'Contact sales to increase limits',
      storage: 'Contact sales to increase limits',
    },
  }

  return hints[basePlan]?.[limitType] || 'Upgrade your plan for more capacity'
}

// Check if feature is available for plan
export function isPlanFeatureAvailable(planName: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(planName)
  const value = limits[feature]

  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false
}

// Legacy compatibility: Export PLAN_LIMITS in the format expected by usageService
export const USAGE_PLAN_LIMITS = {
  FREE: {
    documents: PLAN_LIMITS.FREE.documents,
    pages: PLAN_LIMITS.FREE.pages,
    queries: PLAN_LIMITS.FREE.queries,
    storage: PLAN_LIMITS.FREE.storageBytes,
  },
  STARTER: {
    documents: PLAN_LIMITS.STARTER.documents,
    pages: PLAN_LIMITS.STARTER.pages,
    queries: PLAN_LIMITS.STARTER.queries,
    storage: PLAN_LIMITS.STARTER.storageBytes,
  },
  PRO: {
    documents: PLAN_LIMITS.PRO.documents,
    pages: PLAN_LIMITS.PRO.pages,
    queries: PLAN_LIMITS.PRO.queries,
    storage: PLAN_LIMITS.PRO.storageBytes,
  },
  BUSINESS: {
    documents: PLAN_LIMITS.BUSINESS.documents,
    pages: PLAN_LIMITS.BUSINESS.pages,
    queries: PLAN_LIMITS.BUSINESS.queries,
    storage: PLAN_LIMITS.BUSINESS.storageBytes,
  },
} as const

console.log('[Plans] Loaded plan configuration:', Object.keys(PLAN_LIMITS))
