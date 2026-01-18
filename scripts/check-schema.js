#!/usr/bin/env node

/**
 * Check Database Schema
 * Run: node scripts/check-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkSchema() {
  console.log('\n========================================');
  console.log('  MegaRAG - Database Schema Check');
  console.log('========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const tables = ['documents', 'chunks', 'entities', 'relations', 'chat_sessions', 'chat_messages'];

  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);

    // Try to query the table
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log('  Status: ERROR');
      console.log('  Error code:', error.code);
      console.log('  Message:', error.message);

      if (error.code === 'PGRST204' || error.message.includes('schema cache')) {
        console.log('  Hint: Schema cache issue - table may not exist or needs refresh');
      }
    } else {
      console.log('  Status: EXISTS');
      console.log('  Row count (sample):', data.length);

      if (data.length > 0) {
        console.log('  Columns:', Object.keys(data[0]).join(', '));
      }
    }
  }

  // Check if pgvector extension is enabled
  console.log('\n--- Checking pgvector extension ---');
  const { data: extData, error: extError } = await supabase.rpc('check_pgvector', {});

  if (extError) {
    // Try direct query
    console.log('  Could not check via RPC, trying direct query...');

    // Query column info for chunks table
    const { data: colData, error: colError } = await supabase
      .from('chunks')
      .select('content_vector')
      .limit(1);

    if (colError) {
      console.log('  Cannot query chunks.content_vector:', colError.message);
    } else {
      console.log('  chunks.content_vector column accessible');
    }
  }

  console.log('\n========================================');
  console.log('  Schema Check Complete');
  console.log('========================================\n');
}

checkSchema();
