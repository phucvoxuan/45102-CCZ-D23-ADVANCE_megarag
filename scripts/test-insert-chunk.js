#!/usr/bin/env node

/**
 * Test inserting a chunk with embedding directly
 * Run: node scripts/test-insert-chunk.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testInsertChunk() {
  console.log('\n========================================');
  console.log('  Test: Insert Chunk with Embedding');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // First, get an existing document ID
  console.log('Step 1: Get existing document...');
  const { data: docs, error: docErr } = await supabase
    .from('documents')
    .select('id, file_name')
    .limit(1);

  if (docErr || !docs || docs.length === 0) {
    console.error('No documents found. Please upload a document first.');
    console.log('Error:', docErr?.message);
    process.exit(1);
  }

  const docId = docs[0].id;
  console.log('  Using document:', docId, '(' + docs[0].file_name + ')');
  console.log('');

  // Generate embedding
  console.log('Step 2: Generate embedding...');
  const testContent = 'Test chunk content for embedding verification - ' + new Date().toISOString();

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(testContent);
  const embedding = result.embedding.values;
  console.log('  Embedding dimension:', embedding.length);
  console.log('');

  // Try inserting chunk without workspace first
  console.log('Step 3: Insert chunk WITHOUT workspace...');
  const chunkId = crypto.randomUUID();

  const chunkDataNoWorkspace = {
    id: chunkId,
    document_id: docId,
    chunk_order_index: 999,
    content: testContent,
    content_vector: embedding,
    tokens: 10,
    chunk_type: 'text'
  };

  const { data: r1, error: e1 } = await supabase
    .from('chunks')
    .insert(chunkDataNoWorkspace)
    .select('id, content_vector')
    .single();

  if (e1) {
    console.log('  ERROR (no workspace):', e1.message);

    // Try WITH workspace
    console.log('\nStep 3b: Trying WITH workspace...');
    const chunkDataWithWorkspace = {
      ...chunkDataNoWorkspace,
      id: crypto.randomUUID(),
      workspace: 'default'
    };

    const { data: r2, error: e2 } = await supabase
      .from('chunks')
      .insert(chunkDataWithWorkspace)
      .select('id, content_vector')
      .single();

    if (e2) {
      console.log('  ERROR (with workspace):', e2.message);
      process.exit(1);
    } else {
      console.log('  SUCCESS with workspace!');
      console.log('  Chunk ID:', r2.id);
      console.log('  Has vector:', r2.content_vector != null);

      // Cleanup
      await supabase.from('chunks').delete().eq('id', r2.id);
      console.log('  Cleaned up test chunk');
    }
  } else {
    console.log('  SUCCESS without workspace!');
    console.log('  Chunk ID:', r1.id);
    console.log('  Has vector:', r1.content_vector != null);

    if (r1.content_vector) {
      const vec = typeof r1.content_vector === 'string'
        ? JSON.parse(r1.content_vector)
        : r1.content_vector;
      console.log('  Vector length:', Array.isArray(vec) ? vec.length : 'N/A');
    }

    // Cleanup
    await supabase.from('chunks').delete().eq('id', chunkId);
    console.log('  Cleaned up test chunk');
  }

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

testInsertChunk();
