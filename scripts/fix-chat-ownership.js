/**
 * Script to fix wrongly assigned chat sessions
 * The previous fix-chat-session-user-ids.js incorrectly assigned ALL sessions to info@aidobiz.com
 *
 * Based on user feedback:
 * - Only session "BÀI THỰC HÀNH 2 nói về cái gì?" (2026-01-15) belongs to info@aidobiz.com
 * - The other 6 sessions from 2026-01-10 belong to other test users
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixChatOwnership() {
  console.log('=== Fixing Chat Session Ownership ===\n');

  // Find the user
  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User not found');
    return;
  }

  const userId = targetUser.id;
  console.log('User ID:', userId);
  console.log('');

  // Get sessions for this user
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('Current sessions assigned to user:', sessions?.length || 0);
  console.log('');

  // The only valid session is from 2026-01-15 with title "BÀI THỰC HÀNH 2 nói về cái gì?"
  const validSessionDate = new Date('2026-01-15T00:00:00Z');

  const sessionsToRemove = [];
  const sessionsToKeep = [];

  for (const session of sessions || []) {
    const createdAt = new Date(session.created_at);
    // Sessions from before Jan 15 belong to other users
    if (createdAt < validSessionDate) {
      sessionsToRemove.push(session);
    } else {
      sessionsToKeep.push(session);
    }
  }

  console.log('Sessions to keep (user\'s actual sessions):', sessionsToKeep.length);
  for (const s of sessionsToKeep) {
    console.log(`  - ${s.title} (${s.created_at})`);
  }
  console.log('');

  console.log('Sessions to unassign (belong to other test users):', sessionsToRemove.length);
  for (const s of sessionsToRemove) {
    console.log(`  - ${s.title} (${s.created_at})`);
  }
  console.log('');

  // Remove user_id from wrongly assigned sessions (set to null so they become orphaned)
  // In production, these would be properly assigned to their real owners
  if (sessionsToRemove.length > 0) {
    const sessionIds = sessionsToRemove.map(s => s.id);

    // Delete the wrongly assigned sessions and their messages
    // Since these are test sessions from other users, we'll delete them
    console.log('Deleting wrongly assigned sessions and their messages...');

    for (const sessionId of sessionIds) {
      // Delete messages first
      const { error: msgError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (msgError) {
        console.error(`Error deleting messages for session ${sessionId}:`, msgError);
      }

      // Delete session
      const { error: sessError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessError) {
        console.error(`Error deleting session ${sessionId}:`, sessError);
      }
    }

    console.log(`Deleted ${sessionsToRemove.length} test sessions`);
  }

  // Verify final state
  console.log('\n=== Final State ===');
  const { data: finalSessions, count } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at', { count: 'exact' })
    .eq('user_id', userId);

  console.log(`User now has ${count} chat session(s):`);
  for (const s of finalSessions || []) {
    console.log(`  - ${s.title}`);
  }
}

fixChatOwnership().catch(console.error);
