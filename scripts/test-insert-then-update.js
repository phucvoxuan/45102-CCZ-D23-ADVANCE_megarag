#!/usr/bin/env node

/**
 * Test INSERT then UPDATE approach for vectors
 * Run: node scripts/test-insert-then-update.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function test() {
  console.log('\n========================================');
  console.log('  Test INSERT then UPDATE for Vectors');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get existing document
  const { data: docs } = await supabase.from('documents').select('id').limit(1);
  if (!docs || docs.length === 0) {
    console.error('No documents found');
    process.exit(1);
  }
  const docId = docs[0].id;
  console.log('Using document:', docId);

  // Generate embedding
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent('Test content for insert then update');
  const embedding = result.embedding.values;
  const vectorStr = '[' + embedding.join(',') + ']';

  const chunkId = crypto.randomUUID();

  // Step 1: Insert WITHOUT vector
  console.log('\nStep 1: Insert chunk WITHOUT vector...');
  const { error: insertErr } = await supabase
    .from('chunks')
    .insert({
      id: chunkId,
      document_id: docId,
      chunk_order_index: 999,
      content: 'Test content for insert then update',
      tokens: 6,
      chunk_type: 'text'
    });

  if (insertErr) {
    console.error('Insert error:', insertErr.message);
    process.exit(1);
  }
  console.log('  Inserted successfully');

  // Verify it's null
  const { data: check1 } = await supabase.from('chunks').select('content_vector').eq('id', chunkId).single();
  console.log('  content_vector after insert:', check1?.content_vector ? 'HAS VALUE' : 'NULL');

  // Step 2: Update WITH vector
  console.log('\nStep 2: Update WITH vector...');
  const { error: updateErr } = await supabase
    .from('chunks')
    .update({ content_vector: vectorStr })
    .eq('id', chunkId);

  if (updateErr) {
    console.error('Update error:', updateErr.message);
    await supabase.from('chunks').delete().eq('id', chunkId);
    process.exit(1);
  }
  console.log('  Updated successfully');

  // Verify
  const { data: check2 } = await supabase.from('chunks').select('content_vector').eq('id', chunkId).single();
  console.log('  content_vector after update:', check2?.content_vector ? 'HAS VALUE' : 'NULL');

  if (check2?.content_vector) {
    // Count values to verify it's 768
    const vectorArray = typeof check2.content_vector === 'string'
      ? check2.content_vector.split(',').length
      : check2.content_vector.length;
    console.log('  Vector dimension:', vectorArray);
  }

  // Cleanup
  await supabase.from('chunks').delete().eq('id', chunkId);
  console.log('\nCleanup complete');

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

test().catch(console.error);
