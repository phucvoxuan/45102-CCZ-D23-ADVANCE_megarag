import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/profile - Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone, organization_name, job_title, role, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Profile API] Error fetching profile:', profileError);
      // Profile may not exist yet, return default data from auth
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          phone: null,
          organization_name: null,
          job_title: null,
          role: null,
          updated_at: null,
        },
      });
    }

    // If profile doesn't exist, create one
    if (!profile) {
      const newProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select('id, full_name, email, avatar_url, phone, organization_name, job_title, role, updated_at')
        .single();

      if (createError) {
        console.error('[Profile API] Error creating profile:', createError);
        // Return data from auth if profile creation fails
        return NextResponse.json({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            phone: null,
            organization_name: null,
            job_title: null,
            role: null,
            updated_at: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: createdProfile,
      });
    }

    // Get subscription info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name, status, billing_cycle, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        subscription: subscription || {
          plan_name: 'FREE',
          status: 'active',
          billing_cycle: 'monthly',
          current_period_end: null,
        },
      },
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/profile - Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, phone, organization_name, job_title } = body;

    // Validate input
    if (full_name !== undefined && typeof full_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid full_name' },
        { status: 400 }
      );
    }

    // Build update object (only include fields that were provided)
    const updateData: Record<string, string | null> = {};
    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (organization_name !== undefined) updateData.organization_name = organization_name || null;
    if (job_title !== undefined) updateData.job_title = job_title || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select('id, full_name, email, avatar_url, phone, organization_name, job_title, role, updated_at')
        .single();
    } else {
      // Insert new profile
      result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...updateData,
        })
        .select('id, full_name, email, avatar_url, phone, organization_name, job_title, role, updated_at')
        .single();
    }

    if (result.error) {
      console.error('[Profile API] Error updating profile:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Also update auth user metadata for full_name
    if (full_name !== undefined) {
      await supabase.auth.updateUser({
        data: { full_name },
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
