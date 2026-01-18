/**
 * Feature access control by plan
 * Defines which features are available for each subscription tier
 */

export const FEATURE_ACCESS = {
  // RAG Query Modes - STARTER and above get all 5 modes
  NAIVE_MODE: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  LOCAL_MODE: ['STARTER', 'PRO', 'BUSINESS'],
  GLOBAL_MODE: ['STARTER', 'PRO', 'BUSINESS'],
  HYBRID_MODE: ['STARTER', 'PRO', 'BUSINESS'],
  MIX_MODE: ['STARTER', 'PRO', 'BUSINESS'],

  // Core Features
  KNOWLEDGE_GRAPH: ['STARTER', 'PRO', 'BUSINESS'],
  API_ACCESS: ['PRO', 'BUSINESS'],
  CUSTOM_BRANDING: ['PRO', 'BUSINESS'],
  TEAM_MEMBERS: ['BUSINESS'],
  ADVANCED_ANALYTICS: ['BUSINESS'],
  WEBHOOKS: ['BUSINESS'],

  // Support Levels
  COMMUNITY_SUPPORT: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  EMAIL_SUPPORT: ['STARTER', 'PRO', 'BUSINESS'],
  PRIORITY_SUPPORT: ['PRO', 'BUSINESS'],
  DEDICATED_SUPPORT: ['BUSINESS'],

  // File Types
  PDF_UPLOAD: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  DOCX_UPLOAD: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  TXT_UPLOAD: ['FREE', 'STARTER', 'PRO', 'BUSINESS'],
  AUDIO_UPLOAD: ['STARTER', 'PRO', 'BUSINESS'],
  VIDEO_UPLOAD: ['PRO', 'BUSINESS'],
  EXCEL_UPLOAD: ['STARTER', 'PRO', 'BUSINESS'],
  POWERPOINT_UPLOAD: ['STARTER', 'PRO', 'BUSINESS'],
} as const;

export type FeatureKey = keyof typeof FEATURE_ACCESS;
export type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

const PLAN_ORDER: PlanName[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS'];

/**
 * Check if a plan has access to a feature
 */
export function hasFeatureAccess(planName: string, feature: FeatureKey): boolean {
  const normalizedPlan = (planName?.toUpperCase() || 'FREE') as PlanName;
  const allowedPlans = FEATURE_ACCESS[feature] as readonly string[];
  return allowedPlans.includes(normalizedPlan);
}

/**
 * Get all features available for a plan
 */
export function getAvailableFeatures(planName: string): FeatureKey[] {
  return (Object.keys(FEATURE_ACCESS) as FeatureKey[]).filter((feature) =>
    hasFeatureAccess(planName, feature)
  );
}

/**
 * Get features that would be unlocked by upgrading
 */
export function getUpgradeFeatures(
  currentPlan: string
): { feature: FeatureKey; requiredPlan: PlanName }[] {
  const normalizedPlan = (currentPlan?.toUpperCase() || 'FREE') as PlanName;
  const currentIndex = PLAN_ORDER.indexOf(normalizedPlan);

  return (Object.keys(FEATURE_ACCESS) as FeatureKey[])
    .filter((feature) => !hasFeatureAccess(normalizedPlan, feature))
    .map((feature) => {
      const requiredPlans = FEATURE_ACCESS[feature];
      const requiredPlan = requiredPlans.find(
        (plan) => PLAN_ORDER.indexOf(plan as PlanName) > currentIndex
      );
      return { feature, requiredPlan: requiredPlan as PlanName };
    })
    .filter((item) => item.requiredPlan);
}

/**
 * Get available RAG query modes for a plan
 */
export function getAvailableQueryModes(planName: string): string[] {
  const normalizedPlan = (planName?.toUpperCase() || 'FREE') as PlanName;
  const modes: string[] = ['naive']; // Always available

  if (hasFeatureAccess(normalizedPlan, 'LOCAL_MODE')) modes.push('local');
  if (hasFeatureAccess(normalizedPlan, 'GLOBAL_MODE')) modes.push('global');
  if (hasFeatureAccess(normalizedPlan, 'HYBRID_MODE')) modes.push('hybrid');
  if (hasFeatureAccess(normalizedPlan, 'MIX_MODE')) modes.push('mix');

  return modes;
}

/**
 * Check if a query mode is available for a plan
 */
export function isQueryModeAvailable(planName: string, mode: string): boolean {
  const availableModes = getAvailableQueryModes(planName);
  return availableModes.includes(mode.toLowerCase());
}

/**
 * Get the minimum plan required for a feature
 */
export function getMinimumPlanForFeature(feature: FeatureKey): PlanName {
  const allowedPlans = FEATURE_ACCESS[feature] as readonly string[];
  // Return the first (lowest tier) plan that has access
  for (const plan of PLAN_ORDER) {
    if (allowedPlans.includes(plan)) {
      return plan;
    }
  }
  return 'BUSINESS'; // Default to highest if not found
}

/**
 * Get human-readable feature name
 */
export function getFeatureDisplayName(feature: FeatureKey): string {
  const displayNames: Record<FeatureKey, string> = {
    NAIVE_MODE: 'Basic Query Mode',
    LOCAL_MODE: 'Local Search Mode',
    GLOBAL_MODE: 'Global Search Mode',
    HYBRID_MODE: 'Hybrid Search Mode',
    MIX_MODE: 'Mixed Search Mode',
    KNOWLEDGE_GRAPH: 'Knowledge Graph',
    API_ACCESS: 'API Access',
    CUSTOM_BRANDING: 'Custom Branding',
    TEAM_MEMBERS: 'Team Members',
    ADVANCED_ANALYTICS: 'Advanced Analytics',
    WEBHOOKS: 'Webhook Integrations',
    COMMUNITY_SUPPORT: 'Community Support',
    EMAIL_SUPPORT: 'Email Support',
    PRIORITY_SUPPORT: 'Priority Support',
    DEDICATED_SUPPORT: 'Dedicated Support',
    PDF_UPLOAD: 'PDF Upload',
    DOCX_UPLOAD: 'Word Documents',
    TXT_UPLOAD: 'Text Files',
    AUDIO_UPLOAD: 'Audio Files',
    VIDEO_UPLOAD: 'Video Files',
    EXCEL_UPLOAD: 'Excel Spreadsheets',
    POWERPOINT_UPLOAD: 'PowerPoint Presentations',
  };
  return displayNames[feature] || feature;
}

/**
 * Get available file types for a plan
 */
export function getAvailableFileTypes(planName: string): string[] {
  const normalizedPlan = (planName?.toUpperCase() || 'FREE') as PlanName;
  const fileTypes: string[] = [];

  if (hasFeatureAccess(normalizedPlan, 'PDF_UPLOAD')) fileTypes.push('pdf');
  if (hasFeatureAccess(normalizedPlan, 'DOCX_UPLOAD')) fileTypes.push('docx', 'doc');
  if (hasFeatureAccess(normalizedPlan, 'TXT_UPLOAD')) fileTypes.push('txt', 'md');
  if (hasFeatureAccess(normalizedPlan, 'AUDIO_UPLOAD')) fileTypes.push('mp3', 'wav', 'm4a');
  if (hasFeatureAccess(normalizedPlan, 'VIDEO_UPLOAD')) fileTypes.push('mp4', 'webm', 'mov');
  if (hasFeatureAccess(normalizedPlan, 'EXCEL_UPLOAD')) fileTypes.push('xlsx', 'xls', 'csv');
  if (hasFeatureAccess(normalizedPlan, 'POWERPOINT_UPLOAD')) fileTypes.push('pptx', 'ppt');

  return fileTypes;
}

/**
 * Check if a file type is allowed for a plan
 */
export function isFileTypeAllowed(planName: string, fileExtension: string): boolean {
  const allowedTypes = getAvailableFileTypes(planName);
  return allowedTypes.includes(fileExtension.toLowerCase().replace('.', ''));
}

/**
 * Get team member limit for a plan
 */
export function getTeamMemberLimit(planName: string): number {
  const normalizedPlan = (planName?.toUpperCase() || 'FREE') as PlanName;

  const limits: Record<PlanName, number> = {
    FREE: 1,
    STARTER: 1,
    PRO: 3,
    BUSINESS: 10,
  };

  return limits[normalizedPlan] || 1;
}
