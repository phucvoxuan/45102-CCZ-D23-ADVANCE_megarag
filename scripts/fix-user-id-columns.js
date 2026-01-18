/**
 * Script to add user_id columns to entities, relations, and chunks tables
 * Run this if migration 004 was not applied correctly
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndAddColumn(tableName, columnName, columnDef) {
  console.log('\n--- Checking ' + tableName + '.' + columnName + ' ---');

  // Try to select the column - if it fails, column doesn't exist
  const { error } = await supabase
    .from(tableName)
    .select(columnName)
    .limit(1);

  if (error && error.code === '42703') {
    console.log('Column ' + columnName + ' does not exist in ' + tableName);
    console.log('Please run this SQL in Supabase dashboard:');
    console.log('');
    console.log('  ALTER TABLE ' + tableName + ' ADD COLUMN IF NOT EXISTS ' + columnName + ' ' + columnDef + ';');
    console.log('  CREATE INDEX IF NOT EXISTS idx_' + tableName + '_' + columnName + ' ON ' + tableName + '(' + columnName + ');');
    console.log('');
    return false;
  } else if (error) {
    console.log('Error checking column:', error.message);
    return false;
  } else {
    console.log('Column ' + columnName + ' EXISTS in ' + tableName);
    return true;
  }
}

async function generateMigrationSQL() {
  console.log('=== Checking User ID Columns ===\n');

  const columnsToCheck = [
    { table: 'chunks', column: 'user_id', def: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE' },
    { table: 'entities', column: 'user_id', def: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE' },
    { table: 'relations', column: 'user_id', def: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE' },
  ];

  const missingColumns = [];

  for (const col of columnsToCheck) {
    const exists = await checkAndAddColumn(col.table, col.column, col.def);
    if (!exists) {
      missingColumns.push(col);
    }
  }

  if (missingColumns.length > 0) {
    console.log('\n========================================');
    console.log('FULL SQL TO RUN IN SUPABASE DASHBOARD:');
    console.log('========================================\n');

    let sql = '-- Add user_id columns to tables\n\n';

    for (const col of missingColumns) {
      sql += '-- Add user_id to ' + col.table + '\n';
      sql += 'ALTER TABLE ' + col.table + ' ADD COLUMN IF NOT EXISTS ' + col.column + ' ' + col.def + ';\n';
      sql += 'CREATE INDEX IF NOT EXISTS idx_' + col.table + '_' + col.column + ' ON ' + col.table + '(' + col.column + ');\n\n';
    }

    // Add update script to copy user_id from documents to chunks
    sql += '-- Update chunks with user_id from their parent documents\n';
    sql += 'UPDATE chunks c\n';
    sql += 'SET user_id = d.user_id\n';
    sql += 'FROM documents d\n';
    sql += 'WHERE c.document_id = d.id\n';
    sql += 'AND c.user_id IS NULL\n';
    sql += 'AND d.user_id IS NOT NULL;\n\n';

    console.log(sql);
    console.log('========================================');
    console.log('Copy the SQL above and run it in Supabase SQL Editor');
    console.log('========================================\n');
  } else {
    console.log('\n✓ All user_id columns exist!');
  }

  // Check for data without user_id
  console.log('\n=== Checking for data without user_id ===');

  const { data: docsNoUser, count: docsNoUserCount } = await supabase
    .from('documents')
    .select('id, file_name', { count: 'exact' })
    .is('user_id', null);

  console.log('Documents without user_id:', docsNoUserCount || 0);
  if (docsNoUser && docsNoUser.length > 0) {
    docsNoUser.slice(0, 5).forEach(d => console.log('  - ' + d.file_name));
  }
}

generateMigrationSQL().catch(console.error);
