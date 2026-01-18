/**
 * Quick script to sync usage for a user
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncUsage() {
  // Find user
  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User not found');
    return;
  }

  const userId = targetUser.id;
  console.log('=== Syncing Usage for info@aidobiz.com ===');
  console.log('User ID:', userId);
  console.log('');

  // Get actual document stats
  const { data: docs } = await supabase
    .from('documents')
    .select('id, file_size, page_count, chunks_count')
    .eq('user_id', userId);

  const actualDocCount = docs?.length || 0;
  const actualStorageBytes = docs?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
  const actualPageCount = docs?.reduce((sum, doc) => {
    const pages = doc.page_count || Math.ceil((doc.chunks_count || 0) / 2);
    return sum + pages;
  }, 0) || 0;

  // Get actual query count
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId);

  let queryCount = 0;
  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .in('session_id', sessionIds);
    queryCount = count || 0;
  }

  console.log('Calculated stats:');
  console.log('  Documents:', actualDocCount);
  console.log('  Storage (bytes):', actualStorageBytes);
  console.log('  Storage (KB):', (actualStorageBytes / 1024).toFixed(2));
  console.log('  Pages:', actualPageCount);
  console.log('  Queries:', queryCount);
  console.log('');

  // Get current period
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log('Period:', periodStart.toISOString(), 'to', periodEnd.toISOString());

  // Update usage record
  const { data: existing } = await supabase
    .from('usage_records')
    .select('id')
    .eq('user_id', userId)
    .gte('period_start', periodStart.toISOString())
    .lte('period_start', periodEnd.toISOString())
    .maybeSingle();

  if (existing) {
    console.log('Updating existing record...');
    const { error } = await supabase
      .from('usage_records')
      .update({
        documents_count: actualDocCount,
        storage_bytes: actualStorageBytes,
        pages_count: actualPageCount,
        queries_count: queryCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Update error:', error);
    } else {
      console.log('Updated successfully!');
    }
  } else {
    console.log('Creating new record...');
    const { error } = await supabase
      .from('usage_records')
      .insert({
        user_id: userId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        documents_count: actualDocCount,
        storage_bytes: actualStorageBytes,
        pages_count: actualPageCount,
        queries_count: queryCount,
      });

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Created successfully!');
    }
  }

  // Verify
  console.log('');
  console.log('=== Verification ===');
  const { data: updated } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('Current usage record:', updated);
}

syncUsage().catch(console.error);
