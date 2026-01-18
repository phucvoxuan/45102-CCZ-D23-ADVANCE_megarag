#!/usr/bin/env node

/**
 * Test document processing directly (bypassing HTTP upload)
 * This simulates what happens after a file is uploaded
 * Run: node scripts/test-direct-processing.js
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Constants from the app
const CHUNK_SIZE_TOKENS = 800;
const CHARS_PER_TOKEN = 4;

// Chunk text function (simplified from text-processor.ts)
function chunkText(text, chunkSizeTokens = CHUNK_SIZE_TOKENS) {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();
  if (!normalizedText) return [];

  const totalTokens = Math.ceil(normalizedText.length / CHARS_PER_TOKEN);

  if (totalTokens <= chunkSizeTokens) {
    return [{
      content: normalizedText,
      tokenCount: totalTokens,
    }];
  }

  // Simple chunking by character limit
  const chunkCharLimit = chunkSizeTokens * CHARS_PER_TOKEN;
  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkCharLimit, normalizedText.length);
    const content = normalizedText.slice(start, end).trim();
    if (content) {
      chunks.push({
        content,
        tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
      });
    }
    start = end;
  }

  return chunks;
}

// Vector to string for pgvector
function vectorToString(embedding) {
  return '[' + embedding.join(',') + ']';
}

async function testDirectProcessing() {
  console.log('\n========================================');
  console.log('  Test Direct Document Processing');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test document content
  const testContent = `# Test Document for Embedding Pipeline

## Introduction

This is a comprehensive test document designed to verify the complete embedding generation pipeline.
The document contains multiple sections with varied content to ensure proper chunking and embedding.

## Technical Details

The embedding system uses Google's Gemini text-embedding-004 model which generates 768-dimensional vectors.
These vectors are stored in PostgreSQL using the pgvector extension for efficient similarity search.

### Key Features

1. Semantic search across documents
2. Knowledge graph extraction
3. Multi-modal content support
4. Hybrid retrieval combining vector and keyword search

## Implementation Notes

The processing pipeline involves several steps:
- Document upload and storage
- Text extraction and chunking
- Embedding generation via Gemini API
- Vector storage in Supabase/PostgreSQL

## Conclusion

This test validates that all components work together correctly.
`;

  // Step 1: Create document record
  console.log('Step 1: Creating document record...');
  const docId = crypto.randomUUID();

  const { error: docError } = await supabase
    .from('documents')
    .insert({
      id: docId,
      file_name: 'test-direct-processing.md',
      file_type: 'md',
      file_size: testContent.length,
      status: 'processing'
    });

  if (docError) {
    console.error('Document create error:', docError.message);
    process.exit(1);
  }
  console.log('  Document ID:', docId);
  console.log('');

  // Step 2: Chunk the text
  console.log('Step 2: Chunking text...');
  const textChunks = chunkText(testContent);
  console.log(`  Created ${textChunks.length} chunks`);

  const chunks = textChunks.map((chunk, index) => ({
    id: crypto.randomUUID(),
    document_id: docId,
    chunk_order_index: index,
    content: chunk.content,
    tokens: chunk.tokenCount,
    chunk_type: 'text',
  }));
  console.log('');

  // Step 3: Generate embeddings
  console.log('Step 3: Generating embeddings...');
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  for (const chunk of chunks) {
    try {
      const result = await model.embedContent(chunk.content);
      chunk.content_vector = vectorToString(result.embedding.values);
      console.log(`  Chunk ${chunk.chunk_order_index}: embedding generated (${result.embedding.values.length} dims)`);
    } catch (error) {
      console.error(`  Chunk ${chunk.chunk_order_index}: ERROR - ${error.message}`);
    }
    // Small delay
    await new Promise(r => setTimeout(r, 100));
  }
  console.log('');

  // Step 4: Store chunks (two-step approach)
  console.log('Step 4: Storing chunks...');

  // 4a: Insert without vectors
  const chunksForInsert = chunks.map(c => {
    const { content_vector, ...rest } = c;
    return rest;
  });

  const { error: insertError } = await supabase
    .from('chunks')
    .insert(chunksForInsert);

  if (insertError) {
    console.error('Insert error:', insertError.message);
    await supabase.from('documents').delete().eq('id', docId);
    process.exit(1);
  }
  console.log('  Chunks inserted');

  // 4b: Update with vectors
  let updateCount = 0;
  for (const chunk of chunks) {
    if (chunk.content_vector) {
      const { error } = await supabase
        .from('chunks')
        .update({ content_vector: chunk.content_vector })
        .eq('id', chunk.id);

      if (!error) updateCount++;
    }
  }
  console.log(`  Updated ${updateCount}/${chunks.length} with vectors`);
  console.log('');

  // Step 5: Update document status
  console.log('Step 5: Updating document status...');
  await supabase
    .from('documents')
    .update({ status: 'processed', chunks_count: chunks.length })
    .eq('id', docId);
  console.log('  Status: processed');
  console.log('');

  // Step 6: Verify
  console.log('Step 6: Verifying in database...');
  const { data: storedChunks } = await supabase
    .from('chunks')
    .select('id, content_vector')
    .eq('document_id', docId);

  let withVector = 0;
  for (const c of storedChunks || []) {
    if (c.content_vector) withVector++;
  }
  console.log(`  ${withVector}/${storedChunks?.length || 0} chunks have embeddings`);
  console.log('');

  if (withVector === chunks.length) {
    console.log('========== SUCCESS! ==========');
    console.log('All chunks have embeddings stored correctly!');
  } else {
    console.log('========== PARTIAL ==========');
    console.log('Some chunks missing embeddings');
  }

  // Cleanup
  console.log('\nStep 7: Cleanup...');
  await supabase.from('chunks').delete().eq('document_id', docId);
  await supabase.from('documents').delete().eq('id', docId);
  console.log('  Done');

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

testDirectProcessing().catch(console.error);
