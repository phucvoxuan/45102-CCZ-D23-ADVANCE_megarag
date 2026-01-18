#!/usr/bin/env node

/**
 * Fix Schema - Add missing workspace column to documents table
 * Run: node scripts/fix-schema.js
 *
 * Note: This requires running SQL in Supabase dashboard if the
 * column doesn't exist. This script will check and report status.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fixSchema() {
  console.log('\n========================================');
  console.log('  MegaRAG - Schema Fix Check');
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

  // Check current documents schema
  console.log('Checking documents table schema...\n');

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying documents:', error.message);
    process.exit(1);
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  console.log('Current columns in documents table:');
  columns.forEach(col => console.log(`  - ${col}`));
  console.log('');

  const hasWorkspace = columns.includes('workspace');

  if (hasWorkspace) {
    console.log('Status: workspace column EXISTS');
    console.log('The documents table has the workspace column.');
  } else {
    console.log('Status: workspace column MISSING');
    console.log('');
    console.log('To fix this, you need to run the following SQL in your Supabase dashboard:');
    console.log('');
    console.log('  Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
    console.log('');
    console.log('  Run this SQL:');
    console.log('  ─────────────────────────────────────────────────────────────');
    console.log(`
    -- Add workspace column to documents table
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace VARCHAR(255) DEFAULT 'default';
    CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace);
    UPDATE documents SET workspace = 'default' WHERE workspace IS NULL;
    `);
    console.log('  ─────────────────────────────────────────────────────────────');
    console.log('');
    console.log('After running this SQL, run the test again:');
    console.log('  node scripts/test-full-flow.js');
  }

  // Also check chunks table for content_vector
  console.log('\n--- Checking chunks table ---');
  const { data: chunkData, error: chunkError } = await supabase
    .from('chunks')
    .select('*')
    .limit(1);

  if (chunkError) {
    console.log('Error querying chunks:', chunkError.message);
  } else {
    const chunkColumns = chunkData.length > 0 ? Object.keys(chunkData[0]) : [];
    console.log('Columns:', chunkColumns.join(', '));
    console.log('Has content_vector:', chunkColumns.includes('content_vector'));
    console.log('Has embedding:', chunkColumns.includes('embedding'));
  }

  console.log('\n========================================');
  console.log('  Schema Check Complete');
  console.log('========================================\n');
}

fixSchema();
