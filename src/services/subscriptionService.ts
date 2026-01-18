import { stripe, PLANS, type PlanName, type BillingCycle, getPriceId } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase/server';
import type {
  Subscription,
  SubscriptionInsert,
  UsageRecord,
  UsageRecordInsert,
} from '@/types/database';

export interface UsageLimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}

export class SubscriptionService {
  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    // First, check if user already has a Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .single();

    if (subscription?.stripe_customer_id) {
      return subscription.stripe_customer_id;
    }

    // Also check profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        userId,
      },
    });

    // Save customer ID to profiles
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    return customer.id;
  }

  /**
   * Create a Stripe Checkout session
   */
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    userId: string;
    organizationId?: string;
    successUrl: string;
    cancelUrl: string;
    billingCycle: BillingCycle;
  }): Promise<{ sessionId: string; url: string }> {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        organizationId: params.organizationId || '',
        billingCycle: params.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          organizationId: params.organizationId || '',
        },
      },
      allow_promotion_codes: true,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create a Customer Portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription by user ID or organization ID
   */
  async getSubscription(params: {
    userId?: string;
    organizationId?: string;
  }): Promise<Subscription | null> {
    let query = supabaseAdmin
      .from('subscriptions')
      .select('*');

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    } else if (params.organizationId) {
      query = query.eq('organization_id', params.organizationId);
    } else {
      return null;
    }

    // Use maybeSingle() instead of single() to avoid 406 error when no subscription exists
    const { data, error } = await query
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SubscriptionService] Error fetching subscription:', error);
      return null;
    }

    return data as Subscription | null;
  }

  /**
   * Create or update subscription in database
   */
  async upsertSubscription(data: SubscriptionInsert): Promise<void> {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(data, {
        onConflict: 'stripe_subscription_id',
      });

    if (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: string,
    additionalData?: Partial<SubscriptionInsert>
  ): Promise<void> {
    const updateData: Partial<SubscriptionInsert> = {
      status: status as Subscription['status'],
      updated_at: new Date().toISOString(),
      ...additionalData,
    };

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    // Cancel in Stripe
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update database
    await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);
  }

  /**
   * Get plan limits for a plan name
   */
  getPlanLimits(planName: PlanName) {
    return PLANS[planName]?.limits || PLANS.FREE.limits;
  }

  /**
   * Check if user can perform action based on usage limits
   */
  async checkUsageLimits(
    organizationId: string,
    action: 'document' | 'query' | 'storage',
    additionalBytes?: number
  ): Promise<UsageLimitCheck> {
    // Get subscription
    const subscription = await this.getSubscription({ organizationId });
    const planName: PlanName = (subscription?.plan_name as PlanName) || 'FREE';
    const limits = this.getPlanLimits(planName);

    // Get current usage
    const usage = await this.getCurrentUsage(organizationId);

    switch (action) {
      case 'document':
        return {
          allowed: usage.documents_count < limits.documents,
          current: usage.documents_count,
          limit: limits.documents,
          message: usage.documents_count >= limits.documents
            ? `Document limit reached (${usage.documents_count}/${limits.documents}). Please upgrade your plan.`
            : undefined,
        };

      case 'query':
        return {
          allowed: usage.queries_count < limits.queries,
          current: usage.queries_count,
          limit: limits.queries,
          message: usage.queries_count >= limits.queries
            ? `Query limit reached (${usage.queries_count}/${limits.queries}). Please upgrade your plan.`
            : undefined,
        };

      case 'storage':
        const newTotal = usage.storage_bytes + (additionalBytes || 0);
        return {
          allowed: newTotal <= limits.storage,
          current: usage.storage_bytes,
          limit: limits.storage,
          message: newTotal > limits.storage
            ? `Storage limit would be exceeded. Please upgrade your plan.`
            : undefined,
        };

      default:
        return { allowed: true, current: 0, limit: 0 };
    }
  }

  /**
   * Get current usage for organization
   */
  async getCurrentUsage(organizationId: string): Promise<{
    documents_count: number;
    queries_count: number;
    storage_bytes: number;
  }> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Use maybeSingle() to avoid error when no record exists
    const { data, error } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', periodStart.toISOString())
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SubscriptionService] Error fetching usage:', error);
    }

    if (data) {
      return {
        documents_count: data.documents_count || 0,
        queries_count: data.queries_count || 0,
        storage_bytes: data.storage_bytes || 0,
      };
    }

    // No usage record exists, return zeros
    return {
      documents_count: 0,
      queries_count: 0,
      storage_bytes: 0,
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    organizationId: string,
    type: 'documents' | 'queries' | 'storage',
    amount: number = 1
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Try to get existing record - use maybeSingle to avoid error when no record exists
    const { data: existing } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period_start', periodStart.toISOString())
      .maybeSingle();

    if (existing) {
      // Update existing record
      const updateField = type === 'documents' ? 'documents_count'
        : type === 'queries' ? 'queries_count'
        : 'storage_bytes';

      const newValue = (existing[updateField] || 0) + amount;

      await supabaseAdmin
        .from('usage_records')
        .update({
          [updateField]: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      const newRecord: UsageRecordInsert = {
        organization_id: organizationId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        documents_count: type === 'documents' ? amount : 0,
        queries_count: type === 'queries' ? amount : 0,
        storage_bytes: type === 'storage' ? amount : 0,
      };

      await supabaseAdmin
        .from('usage_records')
        .insert(newRecord);
    }
  }

  /**
   * Reset usage for new billing period
   */
  async resetUsageForPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const newRecord: UsageRecordInsert = {
      organization_id: organizationId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      documents_count: 0,
      queries_count: 0,
      storage_bytes: 0,
    };

    // Use upsert to handle if record already exists
    await supabaseAdmin
      .from('usage_records')
      .upsert(newRecord, {
        onConflict: 'organization_id,period_start',
      });
  }

  /**
   * Get price ID for a plan and billing cycle
   */
  getPriceIdForPlan(planName: PlanName, billingCycle: BillingCycle): string | null {
    return getPriceId(planName, billingCycle);
  }

  /**
   * Determine plan name from Stripe price ID
   */
  getPlanFromPriceId(priceId: string): PlanName {
    for (const [name, config] of Object.entries(PLANS)) {
      if (config.priceIdMonthly === priceId || config.priceIdYearly === priceId) {
        return name as PlanName;
      }
    }
    return 'FREE';
  }

  /**
   * Determine billing cycle from Stripe price ID
   */
  getBillingCycleFromPriceId(priceId: string): BillingCycle {
    for (const config of Object.values(PLANS)) {
      if (config.priceIdYearly === priceId) {
        return 'yearly';
      }
    }
    return 'monthly';
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
