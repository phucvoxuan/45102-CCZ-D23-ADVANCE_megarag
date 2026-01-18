import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/supabase/server';
import { subscriptionService } from '@/services/subscriptionService';

// Disable body parsing - we need the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeServer();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Helper to get period dates from subscription items
 * In Stripe API 2025+, period dates are on subscription items, not the subscription itself
 */
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: number; end: number } {
  const firstItem = subscription.items.data[0];
  if (firstItem) {
    return {
      start: firstItem.current_period_start,
      end: firstItem.current_period_end,
    };
  }
  // Fallback to billing cycle anchor if no items
  return {
    start: subscription.billing_cycle_anchor,
    end: subscription.billing_cycle_anchor,
  };
}

/**
 * Helper to get subscription ID from invoice
 * In Stripe API 2025+, subscription reference is in parent.subscription_details
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscriptionDetails = invoice.parent?.subscription_details;
  if (subscriptionDetails?.subscription) {
    return typeof subscriptionDetails.subscription === 'string'
      ? subscriptionDetails.subscription
      : subscriptionDetails.subscription.id;
  }
  return null;
}

/**
 * Handle checkout.session.completed
 * Triggered when a customer completes the Checkout flow
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const userId = session.metadata?.userId;
  const organizationId = session.metadata?.organizationId;
  const billingCycle = session.metadata?.billingCycle || 'monthly';

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Get subscription details
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) {
    console.error('No subscription ID in session');
    return;
  }

  // Fetch full subscription details from Stripe
  const stripe = getStripeServer();
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as Stripe.Subscription;

  // Get period dates from subscription items
  const period = getSubscriptionPeriod(subscription);

  // Determine plan name from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  const planName = subscriptionService.getPlanFromPriceId(priceId || '');

  // Create or update subscription in database
  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    organization_id: organizationId || null,
    stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: new Date(period.start * 1000).toISOString(),
    current_period_end: new Date(period.end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, {
    onConflict: 'stripe_subscription_id',
  });

  // Initialize usage record for the organization if provided
  if (organizationId) {
    const periodStart = new Date(period.start * 1000);
    const periodEnd = new Date(period.end * 1000);

    await supabaseAdmin.from('usage_records').upsert({
      organization_id: organizationId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      documents_count: 0,
      queries_count: 0,
      storage_bytes: 0,
    }, {
      onConflict: 'organization_id,period_start',
    });
  }

  console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`);
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);

  const userId = subscription.metadata?.userId;
  const organizationId = subscription.metadata?.organizationId;

  if (!userId) {
    console.log('No userId in subscription metadata, skipping');
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const planName = subscriptionService.getPlanFromPriceId(priceId || '');
  const billingCycle = subscriptionService.getBillingCycleFromPriceId(priceId || '');
  const period = getSubscriptionPeriod(subscription);

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    organization_id: organizationId || null,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: new Date(period.start * 1000).toISOString(),
    current_period_end: new Date(period.end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  }, {
    onConflict: 'stripe_subscription_id',
  });

  console.log(`Subscription created: ${subscription.id}`);
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const priceId = subscription.items.data[0]?.price?.id;
  const planName = subscriptionService.getPlanFromPriceId(priceId || '');
  const billingCycle = subscriptionService.getBillingCycleFromPriceId(priceId || '');
  const period = getSubscriptionPeriod(subscription);

  await supabaseAdmin.from('subscriptions').update({
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: new Date(period.start * 1000).toISOString(),
    current_period_end: new Date(period.end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  await supabaseAdmin.from('subscriptions').update({
    status: 'canceled',
    plan_name: 'FREE',
    canceled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription deleted: ${subscription.id}`);
}

/**
 * Handle invoice.paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Processing invoice.paid:', invoice.id);

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  // Get organization from subscription
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('organization_id, user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription?.organization_id) {
    console.log('No organization found for subscription, skipping invoice record');
    return;
  }

  // Create invoice record
  await supabaseAdmin.from('invoices').upsert({
    organization_id: subscription.organization_id,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : null,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    currency: invoice.currency,
    status: 'paid',
    invoice_pdf: invoice.invoice_pdf || null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
    period_start: new Date(invoice.period_start * 1000).toISOString(),
    period_end: new Date(invoice.period_end * 1000).toISOString(),
    paid_at: new Date().toISOString(),
  }, {
    onConflict: 'stripe_invoice_id',
  });

  // Reset usage for new period if this is a recurring invoice
  if (invoice.billing_reason === 'subscription_cycle') {
    await subscriptionService.resetUsageForPeriod(
      subscription.organization_id,
      new Date(invoice.period_start * 1000),
      new Date(invoice.period_end * 1000)
    );
  }

  console.log(`Invoice paid: ${invoice.id}`);
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  // Update subscription status to past_due
  if (subscriptionId) {
    await supabaseAdmin.from('subscriptions').update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', subscriptionId);
  }

  // Record the failed invoice
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('organization_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription?.organization_id) {
    await supabaseAdmin.from('invoices').upsert({
      organization_id: subscription.organization_id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : null,
      amount_paid: 0,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: 'open',
      invoice_pdf: invoice.invoice_pdf || null,
      hosted_invoice_url: invoice.hosted_invoice_url || null,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
    }, {
      onConflict: 'stripe_invoice_id',
    });
  }

  console.log(`Invoice payment failed: ${invoice.id}`);

  // TODO: Send notification email to user about failed payment
}
