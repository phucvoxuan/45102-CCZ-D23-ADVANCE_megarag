/**
 * Payhip Payment Gateway Configuration
 *
 * Payhip is a digital goods platform that supports:
 * - Vietnam credit/debit cards
 * - PayPal
 * - International credit cards
 *
 * Products are created in Payhip dashboard as "Memberships" (recurring)
 */

export interface PayhipProductConfig {
  FREE: string | undefined;
  STARTER_MONTHLY: string | undefined;
  STARTER_YEARLY: string | undefined;
  PRO_MONTHLY: string | undefined;
  PRO_YEARLY: string | undefined;
  BUSINESS_MONTHLY: string | undefined;
  BUSINESS_YEARLY: string | undefined;
}

export const PAYHIP_CONFIG = {
  /**
   * Whether Payhip payments are enabled
   * Set NEXT_PUBLIC_PAYHIP_ENABLED=true in .env to enable
   */
  enabled: process.env.NEXT_PUBLIC_PAYHIP_ENABLED === 'true',

  /**
   * Payhip API key for server-side API calls
   * Found in Payhip Dashboard > Settings > API
   */
  apiKey: process.env.PAYHIP_API_KEY,

  /**
   * Payhip product/membership checkout URLs
   * Create these in Payhip Dashboard > Products > Add Product > Membership
   */
  products: {
    FREE: process.env.PAYHIP_FREE_URL,
    STARTER_MONTHLY: process.env.PAYHIP_STARTER_MONTHLY_URL,
    STARTER_YEARLY: process.env.PAYHIP_STARTER_YEARLY_URL,
    PRO_MONTHLY: process.env.PAYHIP_PRO_MONTHLY_URL,
    PRO_YEARLY: process.env.PAYHIP_PRO_YEARLY_URL,
    BUSINESS_MONTHLY: process.env.PAYHIP_BUSINESS_MONTHLY_URL,
    BUSINESS_YEARLY: process.env.PAYHIP_BUSINESS_YEARLY_URL,
  } as PayhipProductConfig,

  /**
   * Webhook secret for verifying Payhip webhook signatures
   * Found in Payhip Dashboard > Settings > Webhooks
   */
  webhookSecret: process.env.PAYHIP_WEBHOOK_SECRET,

  /**
   * Success URL after payment - Payhip redirects here
   */
  successUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?provider=payhip`
    : 'http://localhost:3000/checkout/success?provider=payhip',

  /**
   * Cancel URL if user cancels - Payhip redirects here
   */
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?provider=payhip`
    : 'http://localhost:3000/checkout/cancel?provider=payhip',
} as const;

/**
 * Payhip API endpoints
 */
export const PAYHIP_API = {
  verifyLicense: 'https://payhip.com/api/v1/license/verify',
  // Payhip doesn't have a public subscription management API
  // Users manage subscriptions through Payhip dashboard
} as const;

/**
 * Map plan names to product keys
 * FREE plan has no billing cycle, just uses 'FREE' key
 */
export function getPayhipProductKey(
  plan: string,
  billingCycle: 'monthly' | 'yearly' | 'free'
): keyof PayhipProductConfig {
  // FREE plan has special handling - no billing cycle suffix
  if (plan.toUpperCase() === 'FREE' || billingCycle === 'free') {
    return 'FREE';
  }
  const key = `${plan.toUpperCase()}_${billingCycle.toUpperCase()}` as keyof PayhipProductConfig;
  return key;
}
