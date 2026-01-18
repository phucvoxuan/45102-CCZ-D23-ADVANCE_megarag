/**
 * Unified Payment Service
 *
 * Abstracts over multiple payment providers (Stripe, Payhip)
 * Allows enabling/disabling providers via environment variables
 *
 * Usage:
 * - Check available providers: getAvailableProviders()
 * - Get provider config: PAYMENT_PROVIDERS[provider]
 * - Use specific provider APIs in their respective modules
 */

import { PLANS, type PlanName, type BillingCycle } from '@/lib/stripe/config';
import { PAYHIP_CONFIG } from '@/lib/payhip/config';

/**
 * Supported payment providers
 */
export type PaymentProvider = 'stripe' | 'payhip';

/**
 * Provider configuration
 */
export interface ProviderInfo {
  enabled: boolean;
  name: string;
  description: string;
  icon: 'credit-card' | 'wallet' | 'paypal';
  /** Provider supports subscriptions (recurring payments) */
  supportsSubscriptions: boolean;
  /** Provider has customer portal for managing subscriptions */
  hasCustomerPortal: boolean;
  /** Regions/markets this provider is best for */
  markets: string[];
}

export interface PaymentProvidersConfig {
  stripe: ProviderInfo;
  payhip: ProviderInfo;
}

/**
 * Payment provider configurations
 */
export const PAYMENT_PROVIDERS: PaymentProvidersConfig = {
  stripe: {
    enabled: process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true',
    name: 'Credit Card (International)',
    description: 'Visa, Mastercard, American Express',
    icon: 'credit-card',
    supportsSubscriptions: true,
    hasCustomerPortal: true,
    markets: ['International', 'US', 'EU'],
  },
  payhip: {
    enabled: process.env.NEXT_PUBLIC_PAYHIP_ENABLED === 'true',
    name: 'Payhip',
    description: 'VN Cards, PayPal, Credit Cards',
    icon: 'wallet',
    supportsSubscriptions: true,
    hasCustomerPortal: false, // Users manage via Payhip dashboard
    markets: ['Vietnam', 'Southeast Asia', 'PayPal regions'],
  },
};

/**
 * Get list of currently enabled payment providers
 * Returns providers in priority order (Payhip first for VN users)
 *
 * Note: We check env vars directly here to ensure runtime evaluation
 * on both client and server
 */
export function getAvailableProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];

  // Check env vars directly for runtime evaluation
  const payhipEnabled = process.env.NEXT_PUBLIC_PAYHIP_ENABLED === 'true';
  const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true';

  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('[Payment] getAvailableProviders called:', {
      payhipEnabled,
      stripeEnabled,
      envPayhip: process.env.NEXT_PUBLIC_PAYHIP_ENABLED,
      envStripe: process.env.NEXT_PUBLIC_STRIPE_ENABLED,
    });
  }

  // Payhip first - works immediately for VN
  if (payhipEnabled) {
    providers.push('payhip');
  }

  // Stripe second - requires bank approval
  if (stripeEnabled) {
    providers.push('stripe');
  }

  return providers;
}

/**
 * Check if any payment provider is available
 */
export function hasAnyPaymentProvider(): boolean {
  return getAvailableProviders().length > 0;
}

/**
 * Get the default/primary payment provider
 */
export function getDefaultProvider(): PaymentProvider | null {
  const providers = getAvailableProviders();
  return providers.length > 0 ? providers[0] : null;
}

/**
 * Check if a specific provider is enabled
 */
export function isProviderEnabled(provider: PaymentProvider): boolean {
  return PAYMENT_PROVIDERS[provider]?.enabled === true;
}

/**
 * Get provider info
 */
export function getProviderInfo(provider: PaymentProvider): ProviderInfo | null {
  return PAYMENT_PROVIDERS[provider] || null;
}

/**
 * Determine which provider to use based on user preferences/region
 * For now, just returns the first available provider
 */
export function selectProvider(
  preferredProvider?: PaymentProvider
): PaymentProvider | null {
  // If user has preference and it's enabled, use it
  if (preferredProvider && isProviderEnabled(preferredProvider)) {
    return preferredProvider;
  }

  // Otherwise use default
  return getDefaultProvider();
}

/**
 * Get checkout URL/session for a provider
 * This is the main entry point for initiating checkout
 */
export interface CheckoutOptions {
  provider: PaymentProvider;
  plan: PlanName;
  billingCycle: BillingCycle;
  userId: string;
  email: string;
  organizationId?: string;
}

export interface CheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Create checkout session/URL for the specified provider
 * This calls the appropriate API route
 */
export async function createCheckout(
  options: CheckoutOptions
): Promise<CheckoutResult> {
  const { provider, plan, billingCycle } = options;

  try {
    const endpoint =
      provider === 'stripe' ? '/api/stripe/checkout' : '/api/payhip/checkout';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        billingCycle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Checkout failed',
      };
    }

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Re-export plan types and config for convenience
export { PLANS, type PlanName, type BillingCycle };
export { PAYHIP_CONFIG };
