import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * DELETE /api/chat/clear-all - Clear all chat history for the authenticated user
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all session IDs for this user
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions to delete',
        deleted: 0
      });
    }

    const sessionIds = sessions.map(s => s.id);

    // Delete all messages for these sessions
    const { error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .in('session_id', sessionIds);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete messages' },
        { status: 500 }
      );
    }

    // Delete all sessions for this user
    const { error: deleteError } = await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting sessions:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'All chat history cleared',
      deleted: sessionIds.length
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
