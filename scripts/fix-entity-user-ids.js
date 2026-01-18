/**
 * Script to update user_id for existing entities and relations
 * based on their source_chunk_ids linking back to documents
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixEntityUserIds() {
  console.log('=== Fixing Entity User IDs ===\n');

  // Step 1: Build chunk_id -> user_id mapping
  console.log('Step 1: Building chunk -> user mapping...');

  const { data: chunks, error: chunkError } = await supabase
    .from('chunks')
    .select('id, document_id');

  if (chunkError) {
    console.error('Error fetching chunks:', chunkError);
    return;
  }

  // Get documents with user_id
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('id, user_id');

  if (docError) {
    console.error('Error fetching documents:', docError);
    return;
  }

  // Build mappings
  const docUserMap = new Map();
  documents.forEach(d => {
    if (d.user_id) {
      docUserMap.set(d.id, d.user_id);
    }
  });

  const chunkUserMap = new Map();
  chunks.forEach(c => {
    const userId = docUserMap.get(c.document_id);
    if (userId) {
      chunkUserMap.set(c.id, userId);
    }
  });

  console.log('  Documents with user_id:', docUserMap.size);
  console.log('  Chunks mappable to user_id:', chunkUserMap.size);

  // Step 2: Update entities
  console.log('\nStep 2: Updating entities...');

  const { data: entities, error: entityError } = await supabase
    .from('entities')
    .select('id, source_chunk_ids, user_id')
    .is('user_id', null);

  if (entityError) {
    console.error('Error fetching entities:', entityError);
    return;
  }

  console.log('  Entities without user_id:', entities?.length || 0);

  let entitiesUpdated = 0;
  for (const entity of entities || []) {
    const sourceChunkIds = entity.source_chunk_ids || [];
    let userId = null;

    // Find user_id from any of the source chunks
    for (const chunkId of sourceChunkIds) {
      userId = chunkUserMap.get(chunkId);
      if (userId) break;
    }

    if (userId) {
      const { error: updateError } = await supabase
        .from('entities')
        .update({ user_id: userId })
        .eq('id', entity.id);

      if (updateError) {
        console.error('  Error updating entity', entity.id, ':', updateError.message);
      } else {
        entitiesUpdated++;
      }
    }
  }

  console.log('  Entities updated:', entitiesUpdated);

  // Step 3: Update relations
  console.log('\nStep 3: Updating relations...');

  const { data: relations, error: relError } = await supabase
    .from('relations')
    .select('id, source_chunk_ids, user_id')
    .is('user_id', null);

  if (relError) {
    console.error('Error fetching relations:', relError);
    return;
  }

  console.log('  Relations without user_id:', relations?.length || 0);

  let relationsUpdated = 0;
  for (const relation of relations || []) {
    const sourceChunkIds = relation.source_chunk_ids || [];
    let userId = null;

    // Find user_id from any of the source chunks
    for (const chunkId of sourceChunkIds) {
      userId = chunkUserMap.get(chunkId);
      if (userId) break;
    }

    if (userId) {
      const { error: updateError } = await supabase
        .from('relations')
        .update({ user_id: userId })
        .eq('id', relation.id);

      if (updateError) {
        console.error('  Error updating relation', relation.id, ':', updateError.message);
      } else {
        relationsUpdated++;
      }
    }
  }

  console.log('  Relations updated:', relationsUpdated);

  // Step 4: Update chunks user_id from their documents
  console.log('\nStep 4: Updating chunks user_id...');

  const { data: chunksNoUser, error: chunksNoUserError } = await supabase
    .from('chunks')
    .select('id, document_id')
    .is('user_id', null);

  if (chunksNoUserError) {
    console.error('Error fetching chunks without user_id:', chunksNoUserError);
    return;
  }

  console.log('  Chunks without user_id:', chunksNoUser?.length || 0);

  let chunksUpdated = 0;
  for (const chunk of chunksNoUser || []) {
    const userId = docUserMap.get(chunk.document_id);
    if (userId) {
      const { error: updateError } = await supabase
        .from('chunks')
        .update({ user_id: userId })
        .eq('id', chunk.id);

      if (updateError) {
        console.error('  Error updating chunk', chunk.id, ':', updateError.message);
      } else {
        chunksUpdated++;
      }
    }
  }

  console.log('  Chunks updated:', chunksUpdated);

  // Summary
  console.log('\n=== Summary ===');
  console.log('Entities updated:', entitiesUpdated);
  console.log('Relations updated:', relationsUpdated);
  console.log('Chunks updated:', chunksUpdated);

  // Verify
  console.log('\n=== Verification ===');

  const { count: entitiesStillNull } = await supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  const { count: relationsStillNull } = await supabase
    .from('relations')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  const { count: chunksStillNull } = await supabase
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  console.log('Entities still without user_id:', entitiesStillNull || 0);
  console.log('Relations still without user_id:', relationsStillNull || 0);
  console.log('Chunks still without user_id:', chunksStillNull || 0);
}

fixEntityUserIds().catch(console.error);
