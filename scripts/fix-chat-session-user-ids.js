/**
 * Script to update user_id for existing chat sessions
 * Links chat sessions to users based on document workspace or email
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixChatSessionUserIds() {
  console.log('=== Fixing Chat Session User IDs ===\n');

  // Get all users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  console.log('Found', users.users.length, 'users');

  // Build user map by email
  const userMap = new Map();
  users.users.forEach(u => {
    userMap.set(u.email, u.id);
  });

  // Get sessions without user_id
  const { data: sessions, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id, workspace, user_id')
    .is('user_id', null);

  if (sessionError) {
    console.error('Error fetching sessions:', sessionError);
    return;
  }

  console.log('Sessions without user_id:', sessions?.length || 0);

  // Get all documents to map workspace to user
  const { data: documents } = await supabase
    .from('documents')
    .select('workspace, user_id');

  const workspaceUserMap = new Map();
  documents?.forEach(d => {
    if (d.workspace && d.user_id) {
      workspaceUserMap.set(d.workspace, d.user_id);
    }
  });

  console.log('Workspace -> User mappings:', workspaceUserMap.size);

  let updated = 0;
  for (const session of sessions || []) {
    let userId = null;

    // Try to find user_id from workspace
    if (session.workspace && workspaceUserMap.has(session.workspace)) {
      userId = workspaceUserMap.get(session.workspace);
    }

    // If workspace is 'default', try to find a user with documents
    if (!userId && session.workspace === 'default') {
      // Find first user with documents in default workspace
      const { data: defaultDocs } = await supabase
        .from('documents')
        .select('user_id')
        .eq('workspace', 'default')
        .limit(1);

      if (defaultDocs && defaultDocs.length > 0) {
        userId = defaultDocs[0].user_id;
      }
    }

    if (userId) {
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({ user_id: userId })
        .eq('id', session.id);

      if (updateError) {
        console.error('  Error updating session', session.id, ':', updateError.message);
      } else {
        updated++;
      }
    }
  }

  console.log('\nSessions updated:', updated);

  // Verification
  const { count: stillNull } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log('Sessions still without user_id:', stillNull || 0);

  // Show sessions per user
  console.log('\n=== Sessions per User ===');
  for (const user of users.users) {
    const { count } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count > 0) {
      console.log('  ', user.email, ':', count, 'sessions');
    }
  }
}

fixChatSessionUserIds().catch(console.error);
