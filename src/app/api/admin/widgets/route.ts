import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';

// Plan widget limits
const WIDGET_LIMITS: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 5,
  BUSINESS: 999, // Unlimited
};

/**
 * GET /api/admin/widgets - List all widgets for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get user's subscription/plan
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
    const widgetLimit = WIDGET_LIMITS[planName] ?? 0;

    // Get widgets
    const { data: widgets, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .select(`
        id,
        name,
        widget_key,
        theme,
        bot_name,
        bot_avatar_url,
        welcome_message_en,
        welcome_message_vi,
        placeholder_en,
        placeholder_vi,
        default_language,
        allowed_domains,
        system_prompt,
        rag_mode,
        max_tokens,
        show_powered_by,
        auto_open_delay,
        is_active,
        created_at,
        updated_at,
        total_conversations,
        total_messages
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching widgets:', error);
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch widgets' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        widgets: widgets || [],
        plan: planName,
        limit: widgetLimit,
        canCreate: (widgets?.length || 0) < widgetLimit,
      },
    });
  } catch (error) {
    console.error('Widget list error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/widgets - Create a new widget
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get user's subscription/plan
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const planName = subscription?.plan_name?.toUpperCase() || 'FREE';
    const widgetLimit = WIDGET_LIMITS[planName] ?? 0;

    // Check if FREE plan
    if (planName === 'FREE') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Upgrade to STARTER or higher to create widgets' } },
        { status: 403 }
      );
    }

    // Check widget limit
    const { count } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= widgetLimit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: `Widget limit reached (${widgetLimit} for ${planName} plan)` } },
        { status: 403 }
      );
    }

    // Parse body
    let body: {
      name: string;
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
      autoOpenDelay?: number;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Widget name is required' } },
        { status: 400 }
      );
    }

    // Get user's organization if any
    const { data: orgMember } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    // STARTER plan must show powered by
    const showPoweredBy = planName === 'STARTER' ? true : body.theme?.showPoweredBy !== false;

    // Generate widget key
    const { data: keyResult } = await supabaseAdmin.rpc('generate_widget_key');
    const widgetKey = keyResult || `wgt_${crypto.randomUUID().replace(/-/g, '')}`;

    // Insert widget
    const { data: widget, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .insert({
        user_id: user.id,
        organization_id: orgMember?.organization_id || null,
        widget_key: widgetKey,
        name: body.name.trim(),
        theme: body.theme || { primaryColor: '#3B82F6', position: 'bottom-right' },
        bot_name: body.botName || 'AI Assistant',
        bot_avatar_url: body.botAvatarUrl || null,
        welcome_message_en: body.welcomeMessageEn || 'Hi! How can I help you today?',
        welcome_message_vi: body.welcomeMessageVi || 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholder_en: body.placeholderEn || 'Type a message...',
        placeholder_vi: body.placeholderVi || 'Nhập tin nhắn...',
        default_language: body.defaultLanguage || 'vi',
        allowed_domains: body.allowedDomains || [],
        system_prompt: body.systemPrompt || null,
        rag_mode: body.ragMode || 'mix',
        max_tokens: body.maxTokens || 2048,
        show_powered_by: showPoweredBy,
        auto_open_delay: body.autoOpenDelay || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating widget:', error);
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create widget' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: widget,
    }, { status: 201 });
  } catch (error) {
    console.error('Widget create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
