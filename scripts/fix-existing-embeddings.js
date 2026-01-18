#!/usr/bin/env node

/**
 * Fix existing chunks that are missing embeddings
 * Run: node scripts/fix-existing-embeddings.js
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

function vectorToString(embedding) {
  return '[' + embedding.join(',') + ']';
}

async function fixExistingEmbeddings() {
  console.log('\n========================================');
  console.log('  Fix Existing Chunks Missing Embeddings');
  console.log('========================================\n');

  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Find chunks without embeddings
  console.log('Step 1: Finding chunks without embeddings...');
  const { data: chunks, error } = await supabase
    .from('chunks')
    .select('id, content')
    .is('content_vector', null);

  if (error) {
    console.error('Error fetching chunks:', error.message);
    process.exit(1);
  }

  console.log(`  Found ${chunks.length} chunks without embeddings`);
  console.log('');

  if (chunks.length === 0) {
    console.log('No chunks need fixing!');
    return;
  }

  // Generate and update embeddings
  console.log('Step 2: Generating embeddings...');
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // Generate embedding
      const result = await model.embedContent(chunk.content);
      const vectorStr = vectorToString(result.embedding.values);

      // Update chunk
      const { error: updateError } = await supabase
        .from('chunks')
        .update({ content_vector: vectorStr })
        .eq('id', chunk.id);

      if (updateError) {
        console.error(`  Chunk ${i + 1}/${chunks.length}: UPDATE ERROR - ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  Chunk ${i + 1}/${chunks.length}: OK`);
        successCount++;
      }
    } catch (err) {
      console.error(`  Chunk ${i + 1}/${chunks.length}: ERROR - ${err.message}`);
      failCount++;
    }

    // Rate limiting
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log('');
  console.log('========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`  Total chunks: ${chunks.length}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log('');

  // Verify
  console.log('Verification:');
  const { data: verifyData } = await supabase
    .from('chunks')
    .select('id')
    .is('content_vector', null);

  console.log(`  Chunks still missing embeddings: ${verifyData?.length || 0}`);

  console.log('\n========================================\n');
}

fixExistingEmbeddings().catch(console.error);
