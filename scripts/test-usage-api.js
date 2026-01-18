/**
 * Test script to verify usage API works correctly
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUsageAPI() {
  console.log('=== Testing Usage API Logic ===\n');

  // Find user
  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === 'info@aidobiz.com');

  if (!targetUser) {
    console.log('User not found');
    return;
  }

  const userId = targetUser.id;
  console.log('User ID:', userId);
  console.log('');

  // Simulate getUsageSummary logic
  console.log('=== Simulating getUsageSummary ===');
  const startTime = Date.now();

  // Get subscription (parallel with usage)
  const subscriptionPromise = supabase
    .from('subscriptions')
    .select('plan_name, current_period_start, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  // Get usage record
  const usagePromise = supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const [subscriptionResult, usageResult] = await Promise.all([
    subscriptionPromise,
    usagePromise
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`Query time: ${elapsed}ms`);
  console.log('');

  console.log('Subscription:', subscriptionResult.data);
  console.log('');
  console.log('Usage Record:', usageResult.data);
  console.log('');

  // Show what the billing page would display
  if (usageResult.data) {
    const usage = usageResult.data;
    console.log('=== What Billing Page Shows ===');
    console.log(`Documents: ${usage.documents_count}`);
    console.log(`Pages: ${usage.pages_count}`);
    console.log(`Storage: ${usage.storage_bytes} bytes (${(usage.storage_bytes / 1024).toFixed(2)} KB)`);
    console.log(`Queries: ${usage.queries_count}`);
  }
}

testUsageAPI().catch(console.error);
