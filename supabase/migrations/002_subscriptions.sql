-- ============================================
-- PHASE A2: Subscription Tables Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Subscriptions Table
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Can be linked to auth.users OR organization (for multi-tenant)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan info
  plan_name TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'active',
  -- Possible status values: 'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'

  -- Billing info
  billing_cycle TEXT DEFAULT 'monthly',
  -- Possible values: 'monthly', 'yearly'

  -- Subscription period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Cancellation info
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Trial info
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure at least one of user_id or organization_id is set
  CONSTRAINT subscription_owner_check CHECK (
    user_id IS NOT NULL OR organization_id IS NOT NULL
  )
);

-- ============================================
-- 2. Usage Records Table
-- ============================================

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to organization
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Billing period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Usage counters
  documents_count INTEGER DEFAULT 0,
  queries_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,

  -- Additional metrics (future use)
  api_calls_count INTEGER DEFAULT 0,
  llm_tokens_used BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per org per period
  UNIQUE(organization_id, period_start)
);

-- ============================================
-- 3. Invoices Table
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to organization
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Stripe identifiers
  stripe_invoice_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,

  -- Invoice details
  amount_paid INTEGER NOT NULL DEFAULT 0, -- in cents
  amount_due INTEGER NOT NULL DEFAULT 0,  -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- URLs
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  -- Period
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,

  -- Payment info
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. Add stripe_customer_id to profiles if using auth.users
-- ============================================

-- First check if profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Add stripe_customer_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'stripe_customer_id') THEN
      ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
  END IF;
END $$;

-- ============================================
-- 5. Enable RLS
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies for Subscriptions
-- ============================================

-- Users can view their own subscription (via user_id or organization membership)
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only service role can insert/update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 7. RLS Policies for Usage Records
-- ============================================

-- Users can view their organization's usage
CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can manage usage records
CREATE POLICY "Service role can manage usage"
  ON usage_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. RLS Policies for Invoices
-- ============================================

-- Users can view their organization's invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can manage invoices
CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_usage_records_org_id ON usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_org_period ON usage_records(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

-- ============================================
-- 10. Updated_at Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to usage_records
DROP TRIGGER IF EXISTS update_usage_records_updated_at ON usage_records;
CREATE TRIGGER update_usage_records_updated_at
  BEFORE UPDATE ON usage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Helper Functions
-- ============================================

-- Function to get current subscription for a user/org
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID DEFAULT NULL, p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status TEXT,
  billing_cycle TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS subscription_id,
    s.plan_name,
    s.status,
    s.billing_cycle,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE (
    (p_user_id IS NOT NULL AND s.user_id = p_user_id)
    OR
    (p_org_id IS NOT NULL AND s.organization_id = p_org_id)
  )
  AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage for an organization
CREATE OR REPLACE FUNCTION get_current_usage(p_org_id UUID)
RETURNS TABLE (
  documents_count INTEGER,
  queries_count INTEGER,
  storage_bytes BIGINT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.documents_count,
    ur.queries_count,
    ur.storage_bytes,
    ur.period_start,
    ur.period_end
  FROM usage_records ur
  WHERE ur.organization_id = p_org_id
  AND NOW() BETWEEN ur.period_start AND ur.period_end
  ORDER BY ur.period_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Done!
-- ============================================
