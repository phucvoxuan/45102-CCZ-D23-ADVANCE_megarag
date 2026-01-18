import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  parsePayhipPassthrough,
  extractPlanFromProductName,
  extractBillingCycleFromProductName,
  calculatePeriodEnd,
} from '@/lib/payhip/client';
import { PAYHIP_CONFIG } from '@/lib/payhip/config';

// Force dynamic rendering for webhooks
export const dynamic = 'force-dynamic';

/**
 * Payhip Webhook Event Types
 *
 * Payhip sends different event types for subscription lifecycle:
 * - subscription:created - New subscription started
 * - subscription:renewed - Recurring payment successful
 * - subscription:cancelled - User cancelled subscription
 * - subscription:expired - Subscription period ended
 * - payment:completed - One-time payment completed
 * - payment:refunded - Payment was refunded
 */
interface PayhipWebhookPayload {
  event_type: string;
  data: {
    // Buyer info
    buyer_email: string;
    buyer_name?: string;

    // Product info
    product_name: string;
    product_link?: string;

    // Subscription info (for memberships)
    subscription_id?: string;
    subscription_status?: string;
    license_key?: string;

    // Payment info
    amount?: number;
    currency?: string;
    transaction_id?: string;

    // Custom data we passed during checkout
    passthrough?: string;
  };
}

/**
 * POST /api/webhooks/payhip
 *
 * Handles webhook events from Payhip for subscription management
 */
export async function POST(request: NextRequest) {
  try {
    const body: PayhipWebhookPayload = await request.json();

    console.log('Payhip webhook received:', {
      event_type: body.event_type,
      product: body.data?.product_name,
      email: body.data?.buyer_email,
    });

    // TODO: Verify webhook signature when Payhip provides one
    // Currently Payhip doesn't have signature verification

    const { event_type, data } = body;

    if (!data) {
      console.error('No data in webhook payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Try to get user info from passthrough data (preferred)
    let userId: string | null = null;
    let organizationId: string | null = null;
    let plan: string = 'FREE';
    let billingCycle: 'monthly' | 'yearly' | 'free' = 'monthly';

    if (data.passthrough) {
      const passthroughData = parsePayhipPassthrough(data.passthrough);
      if (passthroughData) {
        userId = passthroughData.userId;
        organizationId = passthroughData.organizationId;
        plan = passthroughData.plan;
        billingCycle = passthroughData.billingCycle;
      }
    }

    // Fallback: Find user by email if no passthrough
    if (!userId && data.buyer_email) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, organization_id')
        .eq('email', data.buyer_email)
        .single();

      if (profile) {
        userId = profile.id;
        organizationId = profile.organization_id;
      }
    }

    // If still no user, try auth.users table
    if (!userId && data.buyer_email) {
      const { data: authUsers } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', data.buyer_email)
        .single();

      if (authUsers) {
        userId = authUsers.id;
      }
    }

    // Extract plan from product name as fallback
    if (plan === 'FREE' && data.product_name) {
      plan = extractPlanFromProductName(data.product_name);
      billingCycle = extractBillingCycleFromProductName(data.product_name);
    }

    // Handle different event types
    switch (event_type) {
      case 'subscription:created':
      case 'payment:completed':
        if (!userId) {
          console.log('User not found for email:', data.buyer_email);
          // Still return 200 to acknowledge receipt
          return NextResponse.json({
            received: true,
            warning: 'User not found - subscription will be activated on next login',
          });
        }

        await handleSubscriptionCreated(userId, organizationId, data, plan, billingCycle);
        break;

      case 'subscription:renewed':
        await handleSubscriptionRenewed(data, billingCycle);
        break;

      case 'subscription:cancelled':
      case 'subscription:expired':
        await handleSubscriptionCancelled(data);
        break;

      case 'payment:refunded':
        await handlePaymentRefunded(data);
        break;

      default:
        console.log(`Unhandled Payhip event type: ${event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Payhip webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(
  userId: string,
  organizationId: string | null,
  data: PayhipWebhookPayload['data'],
  plan: string,
  billingCycle: 'monthly' | 'yearly' | 'free'
) {
  const now = new Date();
  const periodEnd = calculatePeriodEnd(billingCycle, now);

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      payhip_subscription_id: data.subscription_id || null,
      payhip_license_key: data.license_key || null,
      plan_name: plan,
      status: 'active',
      billing_cycle: billingCycle,
      payment_provider: 'payhip',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  console.log(`Payhip subscription created for user ${userId}, plan: ${plan}`);

  // Initialize usage record if organization exists
  if (organizationId) {
    await supabaseAdmin.from('usage_records').upsert(
      {
        organization_id: organizationId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        documents_count: 0,
        queries_count: 0,
        storage_bytes: 0,
      },
      {
        onConflict: 'organization_id,period_start',
      }
    );
  }
}

/**
 * Handle subscription renewal
 */
async function handleSubscriptionRenewed(
  data: PayhipWebhookPayload['data'],
  billingCycle: 'monthly' | 'yearly' | 'free'
) {
  if (!data.subscription_id) {
    console.log('No subscription_id for renewal event');
    return;
  }

  const now = new Date();
  const periodEnd = calculatePeriodEnd(billingCycle, now);

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      updated_at: now.toISOString(),
    })
    .eq('payhip_subscription_id', data.subscription_id);

  if (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }

  console.log(`Payhip subscription renewed: ${data.subscription_id}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(data: PayhipWebhookPayload['data']) {
  if (!data.subscription_id) {
    console.log('No subscription_id for cancellation event');
    return;
  }

  const now = new Date();

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan_name: 'FREE',
      canceled_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('payhip_subscription_id', data.subscription_id);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  console.log(`Payhip subscription cancelled: ${data.subscription_id}`);
}

/**
 * Handle payment refund
 */
async function handlePaymentRefunded(data: PayhipWebhookPayload['data']) {
  if (!data.subscription_id) {
    console.log('No subscription_id for refund event');
    return;
  }

  const now = new Date();

  // On refund, cancel subscription and downgrade to free
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan_name: 'FREE',
      canceled_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('payhip_subscription_id', data.subscription_id);

  if (error) {
    console.error('Error handling refund:', error);
    throw error;
  }

  console.log(`Payhip subscription refunded and cancelled: ${data.subscription_id}`);
}
