#!/usr/bin/env node

/**
 * Test document upload API end-to-end
 * Run: node scripts/test-upload-api.js
 */

const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const API_BASE = 'http://localhost:3001';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testUploadAPI() {
  console.log('\n========================================');
  console.log('  Test Document Upload API');
  console.log('========================================\n');

  // Create a test file
  const testContent = `# Test Document

This is a test document for verifying the embedding generation pipeline.

## Section 1: Introduction

This section contains some introductory text that should be chunked and embedded.
The embedding system should generate 768-dimensional vectors for each chunk.

## Section 2: Details

More detailed content here. This text helps verify that:
1. Documents are uploaded correctly
2. Text is chunked properly
3. Embeddings are generated
4. Vectors are stored in the database

## Conclusion

This test document helps verify the complete pipeline from upload to embedding storage.
`;

  const testFilePath = path.join(__dirname, 'test-upload-doc.md');
  fs.writeFileSync(testFilePath, testContent);
  console.log('Created test file:', testFilePath);
  console.log('');

  // Upload the file
  console.log('Step 1: Uploading document...');
  try {
    // Use native fetch with file
    const fileBlob = new Blob([testContent], { type: 'text/markdown' });
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-upload-doc.md',
      contentType: 'text/markdown'
    });

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Upload failed:', response.status, text);
      fs.unlinkSync(testFilePath);
      process.exit(1);
    }

    const result = await response.json();
    console.log('Upload response:', JSON.stringify(result, null, 2));
    const documentId = result.documentId;
    console.log('Document ID:', documentId);
    console.log('');

    // Wait for processing
    console.log('Step 2: Waiting for processing...');
    let attempts = 0;
    let status = 'pending';

    while (status !== 'processed' && status !== 'failed' && attempts < 30) {
      await wait(2000);
      attempts++;

      const statusRes = await fetch(`${API_BASE}/api/documents?workspace=default`);
      const docs = await statusRes.json();
      const doc = docs.documents?.find(d => d.id === documentId);

      if (doc) {
        status = doc.status;
        console.log(`  Attempt ${attempts}: status = ${status}, chunks = ${doc.chunks_count || 0}`);
      }
    }

    if (status === 'failed') {
      console.error('Processing failed!');
      fs.unlinkSync(testFilePath);
      process.exit(1);
    }

    console.log('');

    // Verify chunks have embeddings
    console.log('Step 3: Verifying embeddings...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: chunks, error } = await supabase
      .from('chunks')
      .select('id, content, content_vector')
      .eq('document_id', documentId);

    if (error) {
      console.error('Error fetching chunks:', error.message);
    } else {
      console.log(`Found ${chunks.length} chunks`);

      let withVector = 0;
      for (const chunk of chunks) {
        const hasVector = chunk.content_vector != null;
        if (hasVector) withVector++;
        console.log(`  Chunk ${chunk.id.substring(0, 8)}: vector = ${hasVector ? 'YES' : 'NO'}`);
      }

      console.log('');
      console.log(`Summary: ${withVector}/${chunks.length} chunks have embeddings`);

      if (withVector === chunks.length && chunks.length > 0) {
        console.log('\n========== SUCCESS! ==========');
        console.log('All chunks have embeddings!');
      } else {
        console.log('\n========== PARTIAL SUCCESS ==========');
        console.log('Some chunks are missing embeddings');
      }
    }

    // Cleanup
    console.log('\nStep 4: Cleanup...');
    await supabase.from('chunks').delete().eq('document_id', documentId);
    await supabase.from('documents').delete().eq('id', documentId);
    fs.unlinkSync(testFilePath);
    console.log('Cleanup complete');

  } catch (error) {
    console.error('Error:', error.message);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

testUploadAPI().catch(console.error);
