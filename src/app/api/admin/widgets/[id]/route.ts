import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';

interface RouteParams {
  id: string;
}

/**
 * GET /api/admin/widgets/[id] - Get a specific widget
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { data: widget, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !widget) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Widget not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: widget,
    });
  } catch (error) {
    console.error('Widget get error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/widgets/[id] - Update a widget
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check widget exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Widget not found' } },
        { status: 404 }
      );
    }

    // Get user's plan to check powered_by restriction
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE';

    // Parse body
    let body: {
      name?: string;
      theme?: Record<string, unknown>;
      botName?: string;
      botAvatarUrl?: string;
      welcomeMessageEn?: string;
      welcomeMessageVi?: string;
      placeholderEn?: string;
      placeholderVi?: string;
      defaultLanguage?: 'en' | 'vi';
      allowedDomains?: string[];
      systemPrompt?: string;
      ragMode?: string;
      maxTokens?: number;
      showPoweredBy?: boolean;
      autoOpenDelay?: number;
      isActive?: boolean;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.botName !== undefined) updates.bot_name = body.botName;
    if (body.botAvatarUrl !== undefined) updates.bot_avatar_url = body.botAvatarUrl;
    if (body.welcomeMessageEn !== undefined) updates.welcome_message_en = body.welcomeMessageEn;
    if (body.welcomeMessageVi !== undefined) updates.welcome_message_vi = body.welcomeMessageVi;
    if (body.placeholderEn !== undefined) updates.placeholder_en = body.placeholderEn;
    if (body.placeholderVi !== undefined) updates.placeholder_vi = body.placeholderVi;
    if (body.defaultLanguage !== undefined) updates.default_language = body.defaultLanguage;
    if (body.allowedDomains !== undefined) updates.allowed_domains = body.allowedDomains;
    if (body.systemPrompt !== undefined) updates.system_prompt = body.systemPrompt;
    if (body.ragMode !== undefined) updates.rag_mode = body.ragMode;
    if (body.maxTokens !== undefined) updates.max_tokens = body.maxTokens;
    if (body.autoOpenDelay !== undefined) updates.auto_open_delay = body.autoOpenDelay;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    // STARTER plan must always show powered by
    if (body.showPoweredBy !== undefined) {
      updates.show_powered_by = planName === 'STARTER' ? true : body.showPoweredBy;
    }

    const { data: widget, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating widget:', error);
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update widget' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: widget,
    });
  } catch (error) {
    console.error('Widget update error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/widgets/[id] - Delete a widget
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check widget exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Widget not found' } },
        { status: 404 }
      );
    }

    // Delete widget (cascade will delete conversations and messages)
    const { error } = await supabaseAdmin
      .from('chatbot_widgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting widget:', error);
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete widget' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Widget delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
