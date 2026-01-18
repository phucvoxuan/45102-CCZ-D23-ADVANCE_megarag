#!/usr/bin/env node

/**
 * Test Full Embedding Flow - From generation to database insert
 * Run: node scripts/test-full-flow.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testFullFlow() {
  console.log('\n========================================');
  console.log('  MegaRAG - Full Embedding Flow Test');
  console.log('========================================\n');

  // Check environment variables
  const googleAiKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment Variables:');
  console.log('  GOOGLE_AI_API_KEY:', googleAiKey ? `${googleAiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('  SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.log('  SUPABASE_KEY:', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NOT SET');
  console.log('');

  if (!googleAiKey || !supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing required environment variables!');
    process.exit(1);
  }

  // Initialize clients
  const genAI = new GoogleGenerativeAI(googleAiKey);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Step 1: Generate embedding
  console.log('Step 1: Generating embedding...');
  const testText = 'This is a test chunk for the full flow test. It should be stored with its embedding in the database.';

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(testText);
    const embedding = result.embedding.values;

    console.log('  Embedding generated successfully!');
    console.log('  Dimension:', embedding.length);
    console.log('  First 3 values:', embedding.slice(0, 3));
    console.log('');

    // Step 2: Create a test document
    console.log('Step 2: Creating test document...');
    const testDocId = crypto.randomUUID();

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        id: testDocId,
        workspace: 'default',
        file_name: 'test-full-flow.txt',
        file_type: 'txt',
        file_size: testText.length,
        status: 'processed'
      })
      .select()
      .single();

    if (docError) {
      console.error('  ERROR creating document:', docError.message);
      console.log('  Error code:', docError.code);
      console.log('  Error details:', JSON.stringify(docError, null, 2));
      process.exit(1);
    }
    console.log('  Document created:', docData.id);
    console.log('');

    // Step 3: Insert chunk WITH embedding
    console.log('Step 3: Inserting chunk with embedding...');

    const chunkData = {
      workspace: 'default',
      document_id: testDocId,
      chunk_order_index: 0,
      content: testText,
      content_vector: embedding,  // This is a number[]
      tokens: testText.split(' ').length,
      chunk_type: 'text'
    };

    console.log('  Chunk data content_vector type:', typeof chunkData.content_vector);
    console.log('  Is array?', Array.isArray(chunkData.content_vector));
    console.log('  Length:', chunkData.content_vector.length);

    const { data: chunkResult, error: chunkError } = await supabase
      .from('chunks')
      .insert(chunkData)
      .select()
      .single();

    if (chunkError) {
      console.error('  ERROR inserting chunk:', chunkError.message);
      console.log('  Error code:', chunkError.code);
      console.log('  Error details:', JSON.stringify(chunkError, null, 2));

      // Try with stringified vector
      console.log('\n  Trying with stringified vector format...');
      const vectorString = `[${embedding.join(',')}]`;
      chunkData.content_vector = vectorString;

      const { data: retryResult, error: retryError } = await supabase
        .from('chunks')
        .insert(chunkData)
        .select()
        .single();

      if (retryError) {
        console.error('  Still ERROR:', retryError.message);
        // Cleanup document
        await supabase.from('documents').delete().eq('id', testDocId);
        process.exit(1);
      } else {
        console.log('  SUCCESS with stringified format!');
        console.log('  Chunk ID:', retryResult.id);
      }
    } else {
      console.log('  Chunk inserted successfully!');
      console.log('  Chunk ID:', chunkResult.id);
    }
    console.log('');

    // Step 4: Verify the chunk has embedding in database
    console.log('Step 4: Verifying chunk in database...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('chunks')
      .select('id, content, content_vector')
      .eq('document_id', testDocId)
      .single();

    if (verifyError) {
      console.error('  ERROR verifying chunk:', verifyError.message);
    } else {
      console.log('  Chunk ID:', verifyData.id);
      console.log('  Content (first 50 chars):', verifyData.content.substring(0, 50) + '...');
      console.log('  Has content_vector?', verifyData.content_vector != null);
      if (verifyData.content_vector) {
        const vectorArray = typeof verifyData.content_vector === 'string'
          ? JSON.parse(verifyData.content_vector)
          : verifyData.content_vector;
        console.log('  Vector type:', typeof verifyData.content_vector);
        console.log('  Vector length:', Array.isArray(vectorArray) ? vectorArray.length : 'N/A');
      }
    }
    console.log('');

    // Step 5: Cleanup
    console.log('Step 5: Cleaning up test data...');
    await supabase.from('chunks').delete().eq('document_id', testDocId);
    await supabase.from('documents').delete().eq('id', testDocId);
    console.log('  Cleanup complete.');
    console.log('');

    console.log('========================================');
    console.log('  FULL FLOW TEST COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullFlow();
