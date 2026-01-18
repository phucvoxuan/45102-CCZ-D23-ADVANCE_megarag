import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { getPayhipCheckoutUrl } from '@/lib/payhip/client';
import { PAYHIP_CONFIG } from '@/lib/payhip/config';
import { type PlanName, type BillingCycle } from '@/lib/stripe/config';

/**
 * POST /api/payhip/checkout
 *
 * Creates a Payhip checkout URL for subscription purchase
 * Returns the URL that the frontend should redirect to
 */
export async function POST(request: NextRequest) {
  console.log('[Payhip Checkout] API called');
  console.log('[Payhip Checkout] PAYHIP_CONFIG.enabled:', PAYHIP_CONFIG.enabled);
  console.log('[Payhip Checkout] ENV check:', {
    enabled: process.env.NEXT_PUBLIC_PAYHIP_ENABLED,
    hasApiKey: !!process.env.PAYHIP_API_KEY,
  });

  try {
    // Check if Payhip is enabled
    if (!PAYHIP_CONFIG.enabled) {
      console.error('[Payhip Checkout] Payhip not enabled!');
      return NextResponse.json(
        { error: 'Payhip payments are not enabled' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { plan, billingCycle } = body as {
      plan: PlanName;
      billingCycle: BillingCycle;
    };

    // Validate plan
    if (!plan || !['STARTER', 'PRO', 'BUSINESS'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be STARTER, PRO, or BUSINESS' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    // Get user's organization if any
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    // Build Payhip checkout URL
    console.log('[Payhip Checkout] Building URL for:', { plan, billingCycle, userId: user.id });

    const checkoutUrl = getPayhipCheckoutUrl(
      plan,
      billingCycle,
      user.id,
      user.email!,
      profile?.organization_id
    );

    console.log('[Payhip Checkout] Generated URL:', checkoutUrl);

    if (!checkoutUrl) {
      console.error('[Payhip Checkout] No URL generated - check PAYHIP product config');
      console.log('[Payhip Checkout] PAYHIP_CONFIG.products:', PAYHIP_CONFIG.products);
      return NextResponse.json(
        {
          error: `No Payhip product configured for ${plan} ${billingCycle}`,
        },
        { status: 400 }
      );
    }

    console.log(`[Payhip Checkout] Success! Checkout created for user ${user.id}, plan: ${plan} ${billingCycle}`);

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Payhip checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
