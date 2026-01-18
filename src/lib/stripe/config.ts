import Stripe from 'stripe';
import {
  PLAN_LIMITS,
  PLAN_PRICING,
  getPlanLimits,
  getBasePlanName,
  formatBytes as formatBytesFromPlans,
  formatDuration,
  getUpgradeHint,
  type BasePlanName,
  type PlanLimits as FullPlanLimits,
} from '@/lib/plans';

// Re-export shared plan configuration for convenience
export {
  PLAN_LIMITS,
  PLAN_PRICING,
  getPlanLimits,
  getBasePlanName,
  formatDuration,
  getUpgradeHint,
};
export type { BasePlanName, FullPlanLimits };

// Lazy-initialized Stripe client for server-side usage
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility - but prefer getStripeServer()
export const stripe = {
  get customers() { return getStripeServer().customers; },
  get checkout() { return getStripeServer().checkout; },
  get billingPortal() { return getStripeServer().billingPortal; },
  get subscriptions() { return getStripeServer().subscriptions; },
  get webhooks() { return getStripeServer().webhooks; },
  get invoices() { return getStripeServer().invoices; },
} as unknown as Stripe;

// Plan types (re-using BasePlanName from lib/plans)
export type PlanName = BasePlanName;
export type BillingCycle = 'monthly' | 'yearly';

// Stripe-specific plan limits (subset of full limits for backward compatibility)
export interface StripePlanLimits {
  documents: number;
  pages: number;
  queries: number;
  storage: number; // in bytes
}

export interface PlanConfig {
  name: string;
  description: string;
  price: number; // monthly price in USD
  priceYearly: number; // yearly price in USD
  priceId: string | null;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  limits: StripePlanLimits;
  features: string[];
  popular?: boolean;
}

// Helper to convert FullPlanLimits to StripePlanLimits
function toStripeLimits(planName: BasePlanName): StripePlanLimits {
  const limits = PLAN_LIMITS[planName];
  return {
    documents: limits.documents,
    pages: limits.pages,
    queries: limits.queries,
    storage: limits.storageBytes,
  };
}

// Plan configurations - Uses PLAN_LIMITS from lib/plans as Single Source of Truth
export const PLANS: Record<PlanName, PlanConfig> = {
  FREE: {
    name: 'Free',
    description: 'Perfect for trying out AIDORag',
    price: PLAN_PRICING.FREE.monthly,
    priceYearly: PLAN_PRICING.FREE.yearly,
    priceId: null,
    priceIdMonthly: null,
    priceIdYearly: null,
    limits: toStripeLimits('FREE'),
    features: [
      `${PLAN_LIMITS.FREE.documents} documents`,
      `${PLAN_LIMITS.FREE.pages} pages total`,
      `${PLAN_LIMITS.FREE.queries} queries/month`,
      `${formatBytesFromPlans(PLAN_LIMITS.FREE.storageBytes)} storage`,
      `${formatDuration(PLAN_LIMITS.FREE.audioSeconds)} audio`,
      `${formatDuration(PLAN_LIMITS.FREE.videoSeconds)} video`,
      'Naive query mode only',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    description: 'Perfect for individuals and small projects',
    price: PLAN_PRICING.STARTER.monthly,
    priceYearly: PLAN_PRICING.STARTER.yearly,
    priceId: null,
    priceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || null,
    limits: toStripeLimits('STARTER'),
    features: [
      `${PLAN_LIMITS.STARTER.documents} documents`,
      `${PLAN_LIMITS.STARTER.pages} pages total`,
      `${PLAN_LIMITS.STARTER.queries.toLocaleString()} queries/month`,
      `${formatBytesFromPlans(PLAN_LIMITS.STARTER.storageBytes)} storage`,
      `${formatDuration(PLAN_LIMITS.STARTER.audioSeconds)} audio`,
      `${formatDuration(PLAN_LIMITS.STARTER.videoSeconds)} video`,
      'All 5 query modes',
      'Knowledge graph',
      'Email support',
    ],
  },
  PRO: {
    name: 'Pro',
    description: 'Best for growing teams and businesses',
    price: PLAN_PRICING.PRO.monthly,
    priceYearly: PLAN_PRICING.PRO.yearly,
    priceId: null,
    priceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || null,
    limits: toStripeLimits('PRO'),
    features: [
      `${PLAN_LIMITS.PRO.documents} documents`,
      `${PLAN_LIMITS.PRO.pages.toLocaleString()} pages total`,
      `${PLAN_LIMITS.PRO.queries.toLocaleString()} queries/month`,
      `${formatBytesFromPlans(PLAN_LIMITS.PRO.storageBytes)} storage`,
      `${formatDuration(PLAN_LIMITS.PRO.audioSeconds)} audio`,
      `${formatDuration(PLAN_LIMITS.PRO.videoSeconds)} video`,
      'All features',
      'API access',
      'Priority support',
      `${PLAN_LIMITS.PRO.teamMembers} team members`,
    ],
    popular: true,
  },
  BUSINESS: {
    name: 'Business',
    description: 'For large organizations with advanced needs',
    price: PLAN_PRICING.BUSINESS.monthly,
    priceYearly: PLAN_PRICING.BUSINESS.yearly,
    priceId: null,
    priceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || null,
    limits: toStripeLimits('BUSINESS'),
    features: [
      `${PLAN_LIMITS.BUSINESS.documents.toLocaleString()} documents`,
      `${PLAN_LIMITS.BUSINESS.pages.toLocaleString()} pages total`,
      `${PLAN_LIMITS.BUSINESS.queries.toLocaleString()} queries/month`,
      `${formatBytesFromPlans(PLAN_LIMITS.BUSINESS.storageBytes)} storage`,
      `${formatDuration(PLAN_LIMITS.BUSINESS.audioSeconds)} audio`,
      `${formatDuration(PLAN_LIMITS.BUSINESS.videoSeconds)} video`,
      'All features',
      `Team members (up to ${PLAN_LIMITS.BUSINESS.teamMembers})`,
      'Advanced analytics',
      'Webhook integrations',
      'Dedicated support',
    ],
  },
};

// Helper functions
export function getPlanByName(name: string): PlanConfig | null {
  const upperName = name.toUpperCase() as PlanName;
  return PLANS[upperName] || null;
}

export function getPriceId(planName: PlanName, cycle: BillingCycle): string | null {
  const plan = PLANS[planName];
  if (!plan) return null;
  return cycle === 'monthly' ? plan.priceIdMonthly : plan.priceIdYearly;
}

export function getPrice(planName: PlanName, cycle: BillingCycle): number {
  const plan = PLANS[planName];
  if (!plan) return 0;
  return cycle === 'monthly' ? plan.price : plan.priceYearly;
}

export function formatPrice(price: number, cycle: BillingCycle): string {
  if (price === 0) return 'Free';
  const displayPrice = cycle === 'yearly' ? Math.round(price / 12) : price;
  return `$${displayPrice}/mo`;
}

export function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const fullYearlyPrice = monthlyPrice * 12;
  return Math.round(((fullYearlyPrice - yearlyPrice) / fullYearlyPrice) * 100);
}

// Plan names in order for upgrade/downgrade logic
export const PLAN_ORDER: PlanName[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS'];

export function isPlanUpgrade(currentPlan: PlanName, newPlan: PlanName): boolean {
  return PLAN_ORDER.indexOf(newPlan) > PLAN_ORDER.indexOf(currentPlan);
}

export function isPlanDowngrade(currentPlan: PlanName, newPlan: PlanName): boolean {
  return PLAN_ORDER.indexOf(newPlan) < PLAN_ORDER.indexOf(currentPlan);
}
