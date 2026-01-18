/**
 * Payhip Client Utilities
 *
 * Payhip checkout flow:
 * 1. User clicks "Subscribe" -> We redirect to Payhip checkout URL
 * 2. User completes payment on Payhip
 * 3. Payhip redirects to our success URL
 * 4. Payhip sends webhook with payment details
 * 5. We activate subscription based on webhook
 */

import { PAYHIP_CONFIG, PAYHIP_API, getPayhipProductKey } from './config';

/**
 * Build Payhip checkout URL with user tracking parameters
 *
 * Payhip supports passing custom data via URL parameters:
 * - These are returned in webhook payload
 * - Used to link payment to our user
 */
export function getPayhipCheckoutUrl(
  plan: string,
  billingCycle: 'monthly' | 'yearly' | 'free',
  userId: string,
  email: string,
  organizationId?: string
): string | null {
  const productKey = getPayhipProductKey(plan, billingCycle);
  const baseUrl = PAYHIP_CONFIG.products[productKey];

  if (!baseUrl) {
    console.error(`No Payhip product URL configured for ${productKey}`);
    return null;
  }

  try {
    const url = new URL(baseUrl);

    // Payhip accepts custom parameters that are passed to webhooks
    // These help us identify the user when webhook arrives
    url.searchParams.set('passthrough', JSON.stringify({
      userId,
      organizationId: organizationId || null,
      plan: plan.toUpperCase(),
      billingCycle,
    }));

    // Pre-fill buyer email for convenience
    url.searchParams.set('email', email);

    return url.toString();
  } catch (error) {
    console.error('Error building Payhip checkout URL:', error);
    return null;
  }
}

/**
 * Verify a Payhip license key
 *
 * Use this to verify subscription status for a user
 * Returns license validity and product info
 */
export interface PayhipLicenseResponse {
  valid: boolean;
  license_key?: string;
  product_name?: string;
  buyer_email?: string;
  uses?: number;
  max_uses?: number;
  error?: string;
}

export async function verifyPayhipLicense(
  licenseKey: string,
  productLink: string
): Promise<PayhipLicenseResponse> {
  try {
    const response = await fetch(PAYHIP_API.verifyLicense, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_link: productLink,
        license_key: licenseKey,
      }),
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      valid: data.valid === true,
      license_key: data.license_key,
      product_name: data.product_name,
      buyer_email: data.buyer_email,
      uses: data.uses,
      max_uses: data.max_uses,
    };
  } catch (error) {
    console.error('Payhip license verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse passthrough data from Payhip webhook
 */
export interface PayhipPassthrough {
  userId: string;
  organizationId: string | null;
  plan: string;
  billingCycle: 'monthly' | 'yearly' | 'free';
}

export function parsePayhipPassthrough(passthrough: string): PayhipPassthrough | null {
  try {
    const data = JSON.parse(passthrough);
    return {
      userId: data.userId,
      organizationId: data.organizationId || null,
      plan: data.plan,
      billingCycle: data.billingCycle || 'monthly',
    };
  } catch (error) {
    console.error('Error parsing Payhip passthrough:', error);
    return null;
  }
}

/**
 * Extract plan name from Payhip product name
 *
 * Product names in Payhip should follow pattern:
 * "AIDORag Starter Monthly", "AIDORag Pro Yearly", etc.
 */
export function extractPlanFromProductName(productName: string): string {
  const name = productName?.toLowerCase() || '';
  if (name.includes('business')) return 'BUSINESS';
  if (name.includes('pro')) return 'PRO';
  if (name.includes('starter')) return 'STARTER';
  return 'FREE';
}

/**
 * Extract billing cycle from product name
 */
export function extractBillingCycleFromProductName(
  productName: string
): 'monthly' | 'yearly' {
  const name = productName?.toLowerCase() || '';
  return name.includes('yearly') || name.includes('annual') ? 'yearly' : 'monthly';
}

/**
 * Calculate subscription period end date
 * FREE plan has no period end (forever)
 */
export function calculatePeriodEnd(
  billingCycle: 'monthly' | 'yearly' | 'free',
  startDate: Date = new Date()
): Date {
  const endDate = new Date(startDate);
  if (billingCycle === 'free') {
    // FREE plan: set far future date (100 years)
    endDate.setFullYear(endDate.getFullYear() + 100);
  } else if (billingCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}
