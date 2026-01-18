#!/usr/bin/env node

/**
 * Check the actual column types in the database
 * Run: node scripts/check-column-type.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkColumnTypes() {
  console.log('\n========================================');
  console.log('  Check Column Types in Database');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Use RPC to run SQL query for column info
  // First, let's try querying the information_schema
  console.log('Querying information_schema for chunks table...\n');

  // We can't directly query information_schema via supabase-js
  // Let's check what columns we can see and their behavior

  // Get one row to see structure
  const { data: sample, error: sampleErr } = await supabase
    .from('chunks')
    .select('*')
    .limit(1);

  if (sampleErr) {
    console.log('Error:', sampleErr.message);
    return;
  }

  if (sample && sample.length > 0) {
    console.log('Columns in chunks table:');
    for (const [key, value] of Object.entries(sample[0])) {
      const valueType = value === null ? 'null' : typeof value;
      const valuePreview = value === null ? 'null' :
        typeof value === 'string' ? `"${value.substring(0, 30)}..."` :
        Array.isArray(value) ? `array[${value.length}]` :
        typeof value === 'object' ? JSON.stringify(value).substring(0, 30) :
        String(value);
      console.log(`  ${key}: ${valueType} = ${valuePreview}`);
    }
  }

  console.log('\n--- Testing insert with explicit VECTOR format ---\n');

  // Get doc ID
  const { data: docs } = await supabase.from('documents').select('id').limit(1);
  const docId = docs?.[0]?.id;

  if (!docId) {
    console.log('No documents found');
    return;
  }

  // Create a simple test vector (just 5 values for testing)
  // Note: This will fail if the column expects exactly 768 dimensions
  const testVector768 = Array(768).fill(0).map((_, i) => Math.random() - 0.5);
  const vectorStr = '[' + testVector768.join(',') + ']';

  console.log('Attempting insert with vector string format...');
  console.log('Vector string length:', vectorStr.length);
  console.log('First 50 chars:', vectorStr.substring(0, 50) + '...');

  const testId = require('crypto').randomUUID();

  // Insert using raw SQL might work differently
  // Let's try inserting and checking what happens

  const insertData = {
    id: testId,
    document_id: docId,
    chunk_order_index: 999,
    content: 'Test vector insert',
    tokens: 3,
    chunk_type: 'text'
  };

  // First insert without vector
  const { error: insertErr } = await supabase.from('chunks').insert(insertData);
  if (insertErr) {
    console.log('Insert error:', insertErr.message);
    return;
  }
  console.log('Inserted chunk without vector');

  // Now try to update with vector
  console.log('Updating with content_vector...');
  const { data: updateResult, error: updateErr } = await supabase
    .from('chunks')
    .update({ content_vector: vectorStr })
    .eq('id', testId)
    .select('content_vector');

  if (updateErr) {
    console.log('Update error:', updateErr.message);
    console.log('Error code:', updateErr.code);
    console.log('Full error:', JSON.stringify(updateErr, null, 2));
  } else {
    console.log('Update result:', updateResult);
  }

  // Verify
  const { data: verify } = await supabase
    .from('chunks')
    .select('id, content_vector')
    .eq('id', testId)
    .single();

  console.log('Verified content_vector:', verify?.content_vector ? 'HAS VALUE' : 'NULL');

  // Cleanup
  await supabase.from('chunks').delete().eq('id', testId);
  console.log('Cleaned up');

  console.log('\n========================================\n');
}

checkColumnTypes().catch(console.error);
