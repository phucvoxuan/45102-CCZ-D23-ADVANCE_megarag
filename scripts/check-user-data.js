/**
 * Script to check data for a specific user
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData() {
  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User info@aidobiz.com not found');
    console.log('\nAvailable users:');
    users.users.forEach(u => console.log('  -', u.email, '|', u.id));
    return;
  }

  const userId = targetUser.id;
  console.log('=== Data for info@aidobiz.com ===');
  console.log('User ID:', userId);
  console.log('');

  // Documents
  const { data: docs, count: docCount } = await supabase
    .from('documents')
    .select('id, file_name, status, chunks_count', { count: 'exact' })
    .eq('user_id', userId);

  console.log('Documents:', docCount || 0);
  if (docs) {
    docs.forEach(d => console.log('  -', d.file_name, '| status:', d.status, '| chunks:', d.chunks_count));
  }

  // Chunks
  const { count: chunkCount } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('\nChunks:', chunkCount || 0);

  // Entities
  const { data: entities, count: entityCount } = await supabase
    .from('entities')
    .select('id, entity_name, entity_type', { count: 'exact' })
    .eq('user_id', userId);

  console.log('\nEntities:', entityCount || 0);
  if (entities && entities.length > 0) {
    entities.slice(0, 10).forEach(e => console.log('  -', e.entity_name, '(' + e.entity_type + ')'));
    if (entities.length > 10) console.log('  ... and', entities.length - 10, 'more');
  }

  // Relations
  const { data: relations, count: relCount } = await supabase
    .from('relations')
    .select('id, source_entity, target_entity, relation_type', { count: 'exact' })
    .eq('user_id', userId);

  console.log('\nRelations:', relCount || 0);
  if (relations && relations.length > 0) {
    relations.slice(0, 10).forEach(r => console.log('  -', r.source_entity, '->', r.target_entity, '(' + r.relation_type + ')'));
    if (relations.length > 10) console.log('  ... and', relations.length - 10, 'more');
  }

  // Chat sessions
  const { count: sessionCount } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('\nChat Sessions:', sessionCount || 0);
}

checkUserData().catch(console.error);
