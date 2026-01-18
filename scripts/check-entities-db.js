const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('=== Checking Database Data ===\n');

  // Check documents
  const { data: docs, error: docError } = await supabase
    .from('documents')
    .select('id, file_name, user_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Documents:', docs?.length || 0);
  if (docError) console.log('Doc Error:', docError);
  if (docs) {
    docs.forEach(d => {
      console.log('  - ' + d.file_name + ' | user_id: ' + (d.user_id || 'NULL') + ' | status: ' + d.status);
    });
  }

  // Check chunks
  const { data: chunks, error: chunkError } = await supabase
    .from('chunks')
    .select('id, document_id, user_id, chunk_type')
    .limit(5);

  console.log('\nChunks:', chunks?.length || 0);
  if (chunkError) console.log('Chunk Error:', chunkError);
  if (chunks) {
    chunks.forEach(c => {
      console.log('  - ' + c.id.substring(0,8) + '... | doc: ' + (c.document_id?.substring(0,8) || 'NULL') + '... | user_id: ' + (c.user_id || 'NULL') + ' | type: ' + c.chunk_type);
    });
  }

  // Check entities
  const { data: entities, error: entityError } = await supabase
    .from('entities')
    .select('id, entity_name, entity_type, user_id')
    .limit(10);

  console.log('\nEntities:', entities?.length || 0);
  if (entityError) console.log('Entity Error:', entityError);
  if (entities) {
    entities.forEach(e => {
      console.log('  - ' + e.entity_name + ' (' + e.entity_type + ') | user_id: ' + (e.user_id || 'NULL'));
    });
  }

  // Check relations
  const { data: relations, error: relError } = await supabase
    .from('relations')
    .select('id, source_entity, target_entity, relation_type, user_id')
    .limit(10);

  console.log('\nRelations:', relations?.length || 0);
  if (relError) console.log('Relation Error:', relError);
  if (relations) {
    relations.forEach(r => {
      console.log('  - ' + r.source_entity + ' -> ' + r.target_entity + ' (' + r.relation_type + ') | user_id: ' + (r.user_id || 'NULL'));
    });
  }

  // Check if there are entities/relations WITHOUT user_id
  const { count: entitiesNoUser } = await supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  const { count: relationsNoUser } = await supabase
    .from('relations')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log('\n=== Data without user_id ===');
  console.log('Entities without user_id:', entitiesNoUser || 0);
  console.log('Relations without user_id:', relationsNoUser || 0);
}

checkData().catch(console.error);
