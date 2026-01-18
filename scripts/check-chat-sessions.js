/**
 * Script to check chat sessions for a specific user
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkChatSessions() {
  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User not found');
    return;
  }

  const userId = targetUser.id;
  console.log('=== Chat Sessions for info@aidobiz.com ===');
  console.log('User ID:', userId);
  console.log('');

  // Get all chat sessions for user
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, updated_at, workspace, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total sessions:', sessions?.length || 0);
  console.log('');

  if (sessions) {
    for (const session of sessions) {
      // Get message count for this session
      const { count: messageCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);

      console.log(`Session: ${session.id}`);
      console.log(`  Title: ${session.title}`);
      console.log(`  Messages: ${messageCount || 0}`);
      console.log(`  Created: ${session.created_at}`);
      console.log(`  Workspace: ${session.workspace}`);
      console.log('');
    }
  }

  // Check if there are sessions without user_id (orphaned)
  const { data: orphanedSessions, count: orphanedCount } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact' })
    .is('user_id', null);

  console.log('=== Orphaned Sessions (no user_id) ===');
  console.log('Count:', orphanedCount || 0);
}

checkChatSessions().catch(console.error);
