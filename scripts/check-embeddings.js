#!/usr/bin/env node

/**
 * Check if existing chunks have embeddings
 * Run: node scripts/check-embeddings.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkEmbeddings() {
  console.log('\n========================================');
  console.log('  Check Embeddings in Database');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get all chunks and check embeddings
  console.log('Fetching chunks from database...\n');

  const { data: chunks, error } = await supabase
    .from('chunks')
    .select('id, document_id, content, content_vector, embedding')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${chunks.length} chunks\n`);

  let withContentVector = 0;
  let withEmbedding = 0;
  let withoutAny = 0;

  for (const chunk of chunks) {
    const hasContentVector = chunk.content_vector && (
      (Array.isArray(chunk.content_vector) && chunk.content_vector.length > 0) ||
      (typeof chunk.content_vector === 'string' && chunk.content_vector.length > 10)
    );

    const hasEmbedding = chunk.embedding && (
      (Array.isArray(chunk.embedding) && chunk.embedding.length > 0) ||
      (typeof chunk.embedding === 'string' && chunk.embedding.length > 10)
    );

    if (hasContentVector) withContentVector++;
    if (hasEmbedding) withEmbedding++;
    if (!hasContentVector && !hasEmbedding) withoutAny++;

    console.log(`Chunk ${chunk.id.substring(0, 8)}...`);
    console.log(`  Document: ${chunk.document_id.substring(0, 8)}...`);
    console.log(`  Content: ${chunk.content.substring(0, 50)}...`);
    console.log(`  content_vector: ${hasContentVector ? 'YES' : 'NO'}`);
    console.log(`  embedding: ${hasEmbedding ? 'YES' : 'NO'}`);
    console.log('');
  }

  console.log('========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`  Total chunks: ${chunks.length}`);
  console.log(`  With content_vector: ${withContentVector}`);
  console.log(`  With embedding: ${withEmbedding}`);
  console.log(`  Without any vector: ${withoutAny}`);
  console.log('');

  if (withoutAny > 0) {
    console.log('ISSUE: Some chunks are missing embeddings!');
    console.log('This may be why semantic search is not working.');
  } else if (withContentVector > 0) {
    console.log('Chunks have embeddings. Semantic search should work.');
  }

  console.log('');
}

checkEmbeddings();
