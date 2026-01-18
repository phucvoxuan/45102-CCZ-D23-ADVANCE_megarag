// Script to check actual entities table schema in Supabase
// Run: node scripts/check-entities-schema.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('='.repeat(60));
  console.log('CHECKING ENTITIES TABLE SCHEMA');
  console.log('='.repeat(60));

  // Try to select with * and see what columns exist
  const { data: sample, error: sampleError } = await supabase
    .from('entities')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error querying entities:', sampleError);
  } else {
    console.log('\nEntities table columns:', Object.keys(sample?.[0] || {}));
    if (sample?.[0]) {
      console.log('Sample data:', JSON.stringify(sample[0], null, 2));
    } else {
      console.log('No data in entities table');
    }
  }

  // Test insert with ALL required fields (matching our fix)
  console.log('\n--- Testing insert with ALL fields (fixed code format) ---');
  const { v4: uuidv4 } = require('uuid');
  const testId = uuidv4();
  const testUserId = '5bc3c22b-abe0-4b0f-9467-62f789589edd'; // Use existing user from sample

  const testEntity = {
    id: testId,
    workspace: 'test',
    name: 'Test Entity Fixed',
    type: 'TEST',
    entity_name: 'Test Entity Fixed',
    entity_type: 'TEST',
    description: 'Test description for schema verification',
    source_chunk_ids: [],
    user_id: testUserId,
  };

  console.log('Inserting:', JSON.stringify(testEntity, null, 2));

  const { error: insertError } = await supabase
    .from('entities')
    .insert(testEntity);

  if (insertError) {
    console.log('❌ Insert FAILED:');
    console.log('   Code:', insertError.code);
    console.log('   Message:', insertError.message);
    console.log('   Details:', insertError.details);
  } else {
    console.log('✅ Insert SUCCEEDED');
    // Cleanup
    await supabase.from('entities').delete().eq('id', testId);
    console.log('   (Cleaned up test entity)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('CHECKING RELATIONS TABLE SCHEMA');
  console.log('='.repeat(60));

  const { data: relSample, error: relError } = await supabase
    .from('relations')
    .select('*')
    .limit(1);

  if (relError) {
    console.error('Error querying relations:', relError);
  } else {
    console.log('\nRelations table columns:', Object.keys(relSample?.[0] || {}));
    if (relSample?.[0]) {
      console.log('Sample data:', JSON.stringify(relSample[0], null, 2));
    } else {
      console.log('No data in relations table');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

checkSchema().catch(console.error);
