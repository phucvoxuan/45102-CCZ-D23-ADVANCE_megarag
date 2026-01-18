import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chatbots/[id]/analytics - Get analytics for a chatbot
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id, total_messages, total_conversations')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Get daily analytics from widget_analytics table
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: dailyAnalytics, error: analyticsError } = await supabaseAdmin
      .from('widget_analytics')
      .select('*')
      .eq('widget_id', id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get conversation stats
    const { data: conversations } = await supabaseAdmin
      .from('widget_conversations')
      .select('id, created_at, message_count, status')
      .eq('widget_id', id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Calculate summary stats
    const totalConversations = conversations?.length || 0;
    const totalMessages = conversations?.reduce((sum, c) => sum + (c.message_count || 0), 0) || 0;

    // Fill in missing dates with zeros
    const analytics: Record<string, {
      date: string;
      new_conversations: number;
      total_messages: number;
      user_messages: number;
      bot_messages: number;
    }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      analytics[dateStr] = {
        date: dateStr,
        new_conversations: 0,
        total_messages: 0,
        user_messages: 0,
        bot_messages: 0,
      };
    }

    // Merge with actual data
    if (dailyAnalytics) {
      for (const day of dailyAnalytics) {
        if (analytics[day.date]) {
          analytics[day.date] = {
            date: day.date,
            new_conversations: day.new_conversations || 0,
            total_messages: day.total_messages || 0,
            user_messages: day.user_messages || 0,
            bot_messages: day.bot_messages || 0,
          };
        }
      }
    }

    // Convert to array and sort by date
    const chartData = Object.values(analytics).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      summary: {
        totalMessages: chatbot.total_messages || totalMessages,
        totalConversations: chatbot.total_conversations || totalConversations,
        periodMessages: totalMessages,
        periodConversations: totalConversations,
      },
      chartData,
      recentConversations: conversations?.slice(0, 10) || [],
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
