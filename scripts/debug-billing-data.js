/**
 * Debug script to check billing/usage data
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBillingData() {
  // Find user
  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User not found');
    return;
  }

  const userId = targetUser.id;
  console.log('=== Billing Debug for info@aidobiz.com ===');
  console.log('User ID:', userId);
  console.log('');

  // Check subscription
  console.log('=== Subscription ===');
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  console.log('Subscription:', subscription);
  console.log('');

  // Check documents
  console.log('=== Documents ===');
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('id, title, file_size, page_count, chunks_count, user_id')
    .eq('user_id', userId);

  if (docError) {
    console.error('Error fetching documents:', docError);
  } else {
    console.log('Total documents:', documents?.length || 0);
    let totalStorage = 0;
    let totalPages = 0;
    for (const doc of documents || []) {
      console.log(`  - ${doc.title}: file_size=${doc.file_size}, page_count=${doc.page_count}, chunks=${doc.chunks_count}`);
      totalStorage += doc.file_size || 0;
      totalPages += doc.page_count || Math.ceil((doc.chunks_count || 0) / 2);
    }
    console.log('');
    console.log('Total storage (bytes):', totalStorage);
    console.log('Total storage (KB):', (totalStorage / 1024).toFixed(2));
    console.log('Total pages:', totalPages);
  }
  console.log('');

  // Check usage records
  console.log('=== Usage Records ===');
  const { data: usageRecords, error: usageError } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (usageError) {
    console.error('Error fetching usage records:', usageError);
  } else {
    console.log('Usage records found:', usageRecords?.length || 0);
    for (const record of usageRecords || []) {
      console.log(`  Record: documents=${record.documents_count}, pages=${record.pages_count}, storage=${record.storage_bytes}, queries=${record.queries_count}`);
      console.log(`    Period: ${record.period_start} to ${record.period_end}`);
    }
  }
  console.log('');

  // Check chat sessions (for query count)
  console.log('=== Chat Sessions for Query Count ===');
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId);

  console.log('Sessions:', sessions?.length || 0);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map(s => s.id);
    const { count: msgCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .in('session_id', sessionIds);

    console.log('User messages (queries):', msgCount);
  }
}

debugBillingData().catch(console.error);
