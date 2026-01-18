#!/usr/bin/env node

/**
 * Test the full processing flow step by step
 * Run: node scripts/test-processing-flow.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Embedding dimension
const EMBEDDING_DIMENSION = 768;

async function generateEmbeddingsBatch(texts, genAI) {
  console.log(`[Embeddings] Starting batch embedding for ${texts.length} texts`);

  if (texts.length === 0) {
    console.log('[Embeddings] No texts to embed');
    return [];
  }

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const embeddings = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await model.embedContent(texts[i]);
      embeddings.push(result.embedding.values);
      successCount++;
    } catch (error) {
      console.error(`[Embeddings] Error at index ${i}:`, error.message);
      embeddings.push([]);
      failCount++;
    }

    // Small delay to avoid rate limit
    if (i < texts.length - 1) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  console.log(`[Embeddings] Batch complete: ${successCount} success, ${failCount} failed`);
  return embeddings;
}

// Convert embedding to pgvector string format
function vectorToString(embedding) {
  return '[' + embedding.join(',') + ']';
}

async function addEmbeddingsToChunks(chunks, genAI) {
  console.log(`[addEmbeddingsToChunks] Called with ${chunks.length} chunks`);

  const texts = chunks.map(chunk => chunk.content);
  const embeddings = await generateEmbeddingsBatch(texts, genAI);

  const result = chunks.map((chunk, index) => ({
    ...chunk,
    // Convert to string format for Supabase pgvector compatibility
    content_vector: embeddings[index].length > 0 ? vectorToString(embeddings[index]) : undefined,
  }));

  const withEmbeddings = result.filter(c => c.content_vector).length;
  console.log(`[addEmbeddingsToChunks] Complete: ${withEmbeddings}/${chunks.length} chunks have embeddings`);

  return result;
}

async function testProcessingFlow() {
  console.log('\n========================================');
  console.log('  Test Full Processing Flow');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!googleAiKey || !supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Step 1: Create test document
  console.log('Step 1: Creating test document...');
  const docId = crypto.randomUUID();

  // Insert WITHOUT workspace since documents table doesn't have it
  const docData = {
    id: docId,
    file_name: 'test-processing-flow.md',
    file_type: 'md',
    file_size: 500,
    status: 'processing'
  };

  console.log('  Document data:', JSON.stringify(docData, null, 2));

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert(docData)
    .select()
    .single();

  if (docError) {
    console.error('  ERROR creating document:', docError.message);
    console.log('  Error code:', docError.code);
    process.exit(1);
  }
  console.log('  Document created:', doc.id);
  console.log('');

  // Step 2: Create chunks (simulating text processor)
  console.log('Step 2: Creating chunks...');
  const testContent = [
    'This is the first chunk of test content for the processing flow.',
    'Second chunk contains different information about testing.',
    'Third and final chunk wraps up the test document content.'
  ];

  const chunks = testContent.map((content, index) => ({
    id: crypto.randomUUID(),
    document_id: docId,
    chunk_order_index: index,
    content: content,
    tokens: content.split(' ').length,
    chunk_type: 'text',
    metadata: { test: true }
    // Note: NOT including workspace here
  }));

  console.log(`  Created ${chunks.length} chunk objects`);
  console.log('');

  // Step 3: Add embeddings
  console.log('Step 3: Adding embeddings to chunks...');
  const chunksWithEmbeddings = await addEmbeddingsToChunks(chunks, genAI);

  // Check result
  for (let i = 0; i < chunksWithEmbeddings.length; i++) {
    const c = chunksWithEmbeddings[i];
    const vecInfo = c.content_vector ? `string[${c.content_vector.length} chars]` : 'undefined';
    console.log(`  Chunk ${i}: content_vector = ${vecInfo}`);
  }
  console.log('');

  // Step 4: Store chunks (two-step: insert without vectors, then update with vectors)
  console.log('Step 4: Storing chunks in database...');

  // Step 4a: Prepare data - separate vectors from chunks
  const chunksForInsert = chunksWithEmbeddings.map(c => {
    const { content_vector, ...rest } = c;
    return rest;
  });

  const { error: insertError } = await supabase
    .from('chunks')
    .insert(chunksForInsert);

  if (insertError) {
    console.error('  ERROR inserting chunks:', insertError.message);
    console.log('  Error code:', insertError.code);

    // Cleanup
    await supabase.from('documents').delete().eq('id', docId);
    process.exit(1);
  }
  console.log('  Chunks inserted (without vectors)');

  // Step 4b: Update each chunk with its vector
  console.log('  Updating chunks with vectors...');
  let updateCount = 0;
  for (const chunk of chunksWithEmbeddings) {
    if (chunk.content_vector && chunk.id) {
      const { error: updateErr } = await supabase
        .from('chunks')
        .update({ content_vector: chunk.content_vector })
        .eq('id', chunk.id);

      if (!updateErr) updateCount++;
    }
  }
  console.log(`  Updated ${updateCount}/${chunksWithEmbeddings.length} chunks with vectors`);
  console.log('');

  // Step 5: Verify in database
  console.log('Step 5: Verifying chunks in database...');
  const { data: storedChunks, error: fetchError } = await supabase
    .from('chunks')
    .select('id, content, content_vector')
    .eq('document_id', docId);

  if (fetchError) {
    console.error('  ERROR fetching chunks:', fetchError.message);
  } else {
    console.log(`  Found ${storedChunks.length} chunks in database`);
    for (const chunk of storedChunks) {
      const hasVector = chunk.content_vector != null;
      let vectorLen = 0;
      if (hasVector) {
        if (typeof chunk.content_vector === 'string') {
          try {
            vectorLen = JSON.parse(chunk.content_vector).length;
          } catch {
            vectorLen = -1;
          }
        } else if (Array.isArray(chunk.content_vector)) {
          vectorLen = chunk.content_vector.length;
        }
      }
      console.log(`    Chunk ${chunk.id.substring(0, 8)}: vector=${hasVector ? `YES(${vectorLen})` : 'NO'}`);
    }
  }
  console.log('');

  // Step 6: Cleanup
  console.log('Step 6: Cleaning up...');
  await supabase.from('chunks').delete().eq('document_id', docId);
  await supabase.from('documents').delete().eq('id', docId);
  console.log('  Cleanup complete');
  console.log('');

  console.log('========================================');
  console.log('  Processing Flow Test Complete!');
  console.log('========================================\n');
}

testProcessingFlow().catch(console.error);
