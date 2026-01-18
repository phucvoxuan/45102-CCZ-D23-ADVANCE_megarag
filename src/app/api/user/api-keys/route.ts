import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * GET /api/user/api-keys - List API keys for current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has API access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
    if (!['PRO', 'BUSINESS'].includes(planName)) {
      return NextResponse.json(
        { success: false, error: 'API access requires Pro or Business plan' },
        { status: 403 }
      );
    }

    // Get API keys for user
    const { data: keys, error } = await supabaseAdmin
      .from('user_api_keys')
      .select('id, key_prefix, name, scopes, last_used_at, expires_at, created_at, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: keys || [] });
  } catch (error) {
    console.error('API keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-keys - Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has API access
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
    if (!['PRO', 'BUSINESS'].includes(planName)) {
      return NextResponse.json(
        { success: false, error: 'API access requires Pro or Business plan' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate API key
    const keyId = uuidv4();
    const keySecret = crypto.randomBytes(32).toString('hex');
    const fullKey = `mrag_sk_${keySecret}`;
    const keyPrefix = fullKey.substring(0, 12);
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    // Store API key (hash only, not the full key)
    const { data: newKey, error } = await supabaseAdmin
      .from('user_api_keys')
      .insert({
        id: keyId,
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        scopes: ['read', 'write'],
        is_active: true,
      })
      .select('id, key_prefix, name, scopes, created_at, is_active')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    // Return the full key only once (on creation)
    return NextResponse.json({
      success: true,
      data: {
        ...newKey,
        key: fullKey, // Only returned on creation
      },
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
