import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chatbots/[id] - Get a specific chatbot
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: chatbot, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    return NextResponse.json({ chatbot });
  } catch (error) {
    console.error('Get chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/chatbots/[id] - Update a chatbot
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const body = await request.json();

    // Allowed fields to update
    const allowedFields = [
      'name',
      'bot_name',
      'bot_avatar_url',
      'welcome_message_en',
      'welcome_message_vi',
      'placeholder_en',
      'placeholder_vi',
      'default_language',
      'is_active',
      'theme',
      'auto_open_delay',
      'show_powered_by',
      'custom_logo_url',
      'knowledge_base_ids',
      'rag_mode',
      'allowed_domains',
      'system_prompt',
      'max_tokens',
      // New fields from enhanced schema
      'answer_length',
      'answer_tone',
      'auto_reply',
      'show_answer_source',
      'allow_emoji',
      'auto_suggestion',
      'collect_visitor_info',
      'unknown_answer_action',
      'unknown_answer_text',
      'button_position',
      'button_draggable',
      'auto_open_chat',
      'custom_css',
      'button_icon_url',
      'open_in_new_tab',
      'custom_domain',
      'chat_web_url',
      'favicon_url',
      'meta_title',
      'meta_description',
      'webhook_url',
      'webhook_events',
      // Phase 3 - Appearance
      'primary_color',
      'secondary_color',
      'background_color',
      'text_color',
      'border_radius',
      'font_family',
      'theme_mode',
      // Phase 3 - Security
      'domain_restriction_enabled',
    ];

    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: chatbot, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chatbot:', error);
      return NextResponse.json({ error: 'Failed to update chatbot' }, { status: 500 });
    }

    return NextResponse.json({ chatbot });
  } catch (error) {
    console.error('Update chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chatbots/[id] - Delete a chatbot
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership and delete
    const { error } = await supabaseAdmin
      .from('chatbot_widgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting chatbot:', error);
      return NextResponse.json({ error: 'Failed to delete chatbot' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
