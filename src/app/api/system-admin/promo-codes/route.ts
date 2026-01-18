import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';
import type { PromoCode, PromoCodeInsert } from '@/types/database';

// System Admin email (only this user can access)
const SYSTEM_ADMIN_EMAIL = 'phucvoxuan@gmail.com';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system-admin/promo-codes
 * List all promo codes with stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify system admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - System Admin access required' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    const campaign = searchParams.get('campaign');

    // Build query
    let query = supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status
    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .or('valid_until.is.null,valid_until.gt.now()');
    } else if (status === 'expired') {
      query = query.or('is_active.eq.false,valid_until.lt.now()');
    }

    // Filter by campaign
    if (campaign) {
      query = query.eq('campaign_name', campaign);
    }

    const { data: promoCodes, error } = await query;

    if (error) {
      console.error('[Promo Codes API] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch promo codes' },
        { status: 500 }
      );
    }

    // Get stats
    const codesList = promoCodes || [];
    const stats = {
      total: codesList.length,
      active: codesList.filter((p: { is_active: boolean; valid_until: string | null }) =>
        p.is_active && (!p.valid_until || new Date(p.valid_until) > new Date())
      ).length,
      totalRedemptions: codesList.reduce(
        (sum: number, p: { times_redeemed: number | null }) => sum + (p.times_redeemed || 0),
        0
      ),
      campaigns: [...new Set(codesList.map((p: { campaign_name: string | null }) => p.campaign_name).filter(Boolean))],
    };

    return NextResponse.json({
      success: true,
      data: promoCodes as PromoCode[],
      stats,
    });
  } catch (error) {
    console.error('[Promo Codes API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system-admin/promo-codes
 * Create a new promo code
 */
export async function POST(request: NextRequest) {
  try {
    // Verify system admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - System Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json() as PromoCodeInsert;

    // Validate required fields
    if (!body.code || !body.discount_value) {
      return NextResponse.json(
        { success: false, error: 'Code and discount_value are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from('promo_codes')
      .select('id')
      .eq('code', body.code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Promo code already exists' },
        { status: 409 }
      );
    }

    // Insert new promo code
    const { data: promoCode, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code: body.code.toUpperCase(),
        description: body.description,
        discount_type: body.discount_type || 'percent',
        discount_value: body.discount_value,
        payhip_coupon_id: body.payhip_coupon_id,
        stripe_coupon_id: body.stripe_coupon_id,
        stripe_promo_code_id: body.stripe_promo_code_id,
        max_redemptions: body.max_redemptions,
        valid_until: body.valid_until,
        applies_to_plans: body.applies_to_plans,
        minimum_amount: body.minimum_amount,
        first_time_only: body.first_time_only || false,
        campaign_name: body.campaign_name,
        campaign_notes: body.campaign_notes,
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Promo Codes API] Insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create promo code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: promoCode as PromoCode,
    });
  } catch (error) {
    console.error('[Promo Codes API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
