import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';
import type { PromoCode, PromoCodeInsert } from '@/types/database';

// System Admin email (only this user can access)
const SYSTEM_ADMIN_EMAIL = 'phucvoxuan@gmail.com';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/system-admin/promo-codes/[id]
 * Get single promo code with redemption stats
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify system admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - System Admin access required' },
        { status: 401 }
      );
    }

    // Get promo code
    const { data: promoCode, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !promoCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code not found' },
        { status: 404 }
      );
    }

    // Get redemption history
    const { data: redemptions } = await supabaseAdmin
      .from('promo_code_redemptions')
      .select('*')
      .eq('promo_code_id', id)
      .order('redeemed_at', { ascending: false })
      .limit(50);

    // Calculate stats
    const totalSaved = (redemptions || []).reduce(
      (sum: number, r: { discount_amount?: number }) => sum + (r.discount_amount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: promoCode as PromoCode,
      redemptions: redemptions || [],
      stats: {
        totalRedemptions: promoCode.times_redeemed || 0,
        totalSaved: totalSaved / 100, // Convert cents to dollars
        remainingUses: promoCode.max_redemptions
          ? promoCode.max_redemptions - (promoCode.times_redeemed || 0)
          : 'Unlimited',
      },
    });
  } catch (error) {
    console.error('[Promo Code API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/system-admin/promo-codes/[id]
 * Update a promo code
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify system admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - System Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json() as Partial<PromoCodeInsert>;

    // Update promo code
    const { data: promoCode, error } = await supabaseAdmin
      .from('promo_codes')
      .update({
        ...(body.description !== undefined && { description: body.description }),
        ...(body.discount_type !== undefined && { discount_type: body.discount_type }),
        ...(body.discount_value !== undefined && { discount_value: body.discount_value }),
        ...(body.max_redemptions !== undefined && { max_redemptions: body.max_redemptions }),
        ...(body.valid_until !== undefined && { valid_until: body.valid_until }),
        ...(body.campaign_name !== undefined && { campaign_name: body.campaign_name }),
        ...(body.campaign_notes !== undefined && { campaign_notes: body.campaign_notes }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Promo Code API] Update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update promo code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: promoCode as PromoCode,
    });
  } catch (error) {
    console.error('[Promo Code API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/system-admin/promo-codes/[id]
 * Deactivate a promo code (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify system admin access
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.email !== SYSTEM_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - System Admin access required' },
        { status: 401 }
      );
    }

    // Soft delete - just deactivate
    const { error } = await supabaseAdmin
      .from('promo_codes')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[Promo Code API] Delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to deactivate promo code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promo code deactivated',
    });
  } catch (error) {
    console.error('[Promo Code API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
