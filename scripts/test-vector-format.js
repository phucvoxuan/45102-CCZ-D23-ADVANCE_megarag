#!/usr/bin/env node

/**
 * Test different vector formats for Supabase/pgvector
 * Run: node scripts/test-vector-format.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testVectorFormat() {
  console.log('\n========================================');
  console.log('  Test Vector Format for Supabase');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get an existing document
  const { data: docs } = await supabase.from('documents').select('id').limit(1);
  if (!docs || docs.length === 0) {
    console.error('No documents found');
    process.exit(1);
  }
  const docId = docs[0].id;

  // Generate a test embedding
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent('Test content for vector format');
  const embedding = result.embedding.values;
  console.log('Embedding generated, length:', embedding.length);
  console.log('');

  // Test 1: Raw array (current approach)
  console.log('Test 1: Raw JavaScript array...');
  const id1 = crypto.randomUUID();
  const chunk1 = {
    id: id1,
    document_id: docId,
    chunk_order_index: 901,
    content: 'Test 1: raw array',
    content_vector: embedding,
    tokens: 5,
    chunk_type: 'text'
  };

  const { error: e1 } = await supabase.from('chunks').insert(chunk1);
  if (e1) {
    console.log('  Insert error:', e1.message);
  } else {
    const { data: r1 } = await supabase.from('chunks').select('content_vector').eq('id', id1).single();
    console.log('  Stored content_vector:', r1?.content_vector ? 'HAS VALUE' : 'NULL');
    await supabase.from('chunks').delete().eq('id', id1);
  }
  console.log('');

  // Test 2: JSON string format
  console.log('Test 2: JSON string format [x,y,z...]...');
  const id2 = crypto.randomUUID();
  const vectorString = '[' + embedding.join(',') + ']';
  const chunk2 = {
    id: id2,
    document_id: docId,
    chunk_order_index: 902,
    content: 'Test 2: JSON string',
    content_vector: vectorString,
    tokens: 5,
    chunk_type: 'text'
  };

  const { error: e2 } = await supabase.from('chunks').insert(chunk2);
  if (e2) {
    console.log('  Insert error:', e2.message);
  } else {
    const { data: r2 } = await supabase.from('chunks').select('content_vector').eq('id', id2).single();
    console.log('  Stored content_vector:', r2?.content_vector ? 'HAS VALUE' : 'NULL');
    if (r2?.content_vector) {
      console.log('  Type:', typeof r2.content_vector);
      // Try to get length
      let len = 0;
      if (typeof r2.content_vector === 'string') {
        try { len = JSON.parse(r2.content_vector).length; } catch {}
      } else if (Array.isArray(r2.content_vector)) {
        len = r2.content_vector.length;
      }
      console.log('  Vector length:', len);
    }
    await supabase.from('chunks').delete().eq('id', id2);
  }
  console.log('');

  // Test 3: Using .rpc with direct SQL
  console.log('Test 3: Direct SQL via RPC (if available)...');
  // This would require a custom function, skip for now
  console.log('  Skipped - would require custom SQL function');
  console.log('');

  // Test 4: Check existing chunks
  console.log('Test 4: Query existing chunks...');
  const { data: existingChunks } = await supabase
    .from('chunks')
    .select('id, content_vector')
    .limit(3);

  for (const c of existingChunks || []) {
    console.log(`  Chunk ${c.id.substring(0, 8)}: content_vector = ${c.content_vector ? 'exists' : 'NULL'}`);
  }

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

testVectorFormat().catch(console.error);
