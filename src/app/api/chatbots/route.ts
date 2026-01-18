import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

/**
 * GET /api/chatbots - Get all chatbots for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch chatbots with admin client to bypass RLS issues
    const { data: chatbots, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chatbots:', error);
      return NextResponse.json({ error: 'Failed to fetch chatbots' }, { status: 500 });
    }

    return NextResponse.json({ chatbots });
  } catch (error) {
    console.error('Chatbots API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/chatbots - Create a new chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate unique widget key
    const widgetKey = `wgt_${nanoid(12)}`;

    // Create the chatbot
    const { data: chatbot, error } = await supabaseAdmin
      .from('chatbot_widgets')
      .insert({
        user_id: user.id,
        name: name.trim(),
        widget_key: widgetKey,
        bot_name: 'AI Assistant',
        welcome_message_en: 'Hello! How can I help you today?',
        welcome_message_vi: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholder_en: 'Type your message...',
        placeholder_vi: 'Nhập tin nhắn của bạn...',
        default_language: 'en',
        is_active: true,
        theme: {
          primaryColor: '#6366f1',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderRadius: '12px',
        },
        // Default values for new fields
        answer_length: 'normal',
        answer_tone: 'professional',
        auto_reply: true,
        show_answer_source: true,
        allow_emoji: false,
        auto_suggestion: true,
        button_position: 'bottom-right',
        button_draggable: false,
        auto_open_chat: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chatbot:', error);
      return NextResponse.json({ error: 'Failed to create chatbot' }, { status: 500 });
    }

    return NextResponse.json({ chatbot }, { status: 201 });
  } catch (error) {
    console.error('Create chatbot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
