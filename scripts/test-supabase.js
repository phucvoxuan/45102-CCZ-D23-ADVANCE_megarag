#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Run: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const REQUIRED_TABLES = [
  'documents',
  'chunks',
  'entities',
  'relations',
  'chat_sessions',
  'chat_messages',
  'llm_cache',
];

const OPTIONAL_TABLES = [
  'organizations',
  'api_keys',
  'usage_logs',
];

async function testConnection() {
  console.log('\n========================================');
  console.log('  MegaRAG - Supabase Connection Test');
  console.log('========================================\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }

  if (!supabaseKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set');
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('Service Key:', supabaseKey.substring(0, 20) + '...\n');

  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Testing connection...\n');

  // Test connection with a simple query
  try {
    const { error } = await supabase.from('documents').select('count', { count: 'exact', head: true }).limit(0);

    if (error && !error.message.includes('does not exist')) {
      console.error('Connection FAILED:', error.message);
      process.exit(1);
    }

    console.log('Connection: OK\n');
  } catch (err) {
    console.error('Connection FAILED:', err.message);
    process.exit(1);
  }

  // Check required tables
  console.log('Checking required tables:');
  console.log('-'.repeat(40));

  const missingTables = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(0);

      if (error && error.message.includes('does not exist')) {
        console.log(`  [ ] ${table} - MISSING`);
        missingTables.push(table);
      } else if (error) {
        console.log(`  [?] ${table} - ERROR: ${error.message}`);
      } else {
        console.log(`  [x] ${table} - OK`);
      }
    } catch (err) {
      console.log(`  [!] ${table} - ERROR: ${err.message}`);
      missingTables.push(table);
    }
  }

  console.log('\nChecking optional tables:');
  console.log('-'.repeat(40));

  for (const table of OPTIONAL_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(0);

      if (error && error.message.includes('does not exist')) {
        console.log(`  [ ] ${table} - not created (optional)`);
      } else if (error) {
        console.log(`  [?] ${table} - ERROR: ${error.message}`);
      } else {
        console.log(`  [x] ${table} - OK`);
      }
    } catch (err) {
      console.log(`  [ ] ${table} - not created (optional)`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================\n');

  if (missingTables.length === 0) {
    console.log('All required tables exist!\n');
    console.log('Your database is ready to use.\n');
  } else {
    console.log(`Missing ${missingTables.length} required table(s):\n`);
    missingTables.forEach(t => console.log(`  - ${t}`));
    console.log('\nPlease run the following SQL files in Supabase SQL Editor:');
    console.log('-'.repeat(50));
    console.log('1. supabase/core_schema.sql        (required)');
    console.log('2. supabase/white_label_schema.sql (for multi-tenant)');
    console.log('3. supabase/chat_tables.sql        (for chat feature)');
    console.log('4. supabase/add_chat_settings.sql  (additional settings)');
    console.log('-'.repeat(50));
    console.log('\nAlternatively, run all at once by concatenating them.\n');
  }
}

testConnection().catch(console.error);
