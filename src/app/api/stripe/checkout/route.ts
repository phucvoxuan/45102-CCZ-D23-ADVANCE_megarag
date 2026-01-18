import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { subscriptionService } from '@/services/subscriptionService';
import { PLANS, type PlanName, type BillingCycle } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId, billingCycle, planName } = body as {
      priceId?: string;
      billingCycle?: BillingCycle;
      planName?: PlanName;
    };

    // Validate input - need either priceId or planName + billingCycle
    let finalPriceId: string | undefined = priceId;

    if (!finalPriceId && planName && billingCycle) {
      const resolvedPriceId = subscriptionService.getPriceIdForPlan(planName, billingCycle);
      finalPriceId = resolvedPriceId || undefined;
    }

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Missing priceId or planName with billingCycle' },
        { status: 400 }
      );
    }

    // Get user's profile to find organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    // Get or create Stripe customer
    const customerId = await subscriptionService.getOrCreateCustomer(
      user.id,
      user.email!,
      profile?.full_name || undefined
    );

    // Determine billing cycle from priceId if not provided
    const cycle = billingCycle || subscriptionService.getBillingCycleFromPriceId(finalPriceId);

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { sessionId, url } = await subscriptionService.createCheckoutSession({
      customerId,
      priceId: finalPriceId,
      userId: user.id,
      organizationId: profile?.organization_id || undefined,
      successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      billingCycle: cycle,
    });

    return NextResponse.json({
      sessionId,
      url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET - Retrieve session info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    const { stripe } = await import('@/lib/stripe/config');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return NextResponse.json({
      status: session.status,
      customerEmail: session.customer_details?.email,
      subscriptionId: typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
