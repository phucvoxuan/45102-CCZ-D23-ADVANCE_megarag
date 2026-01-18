-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Add user_api_keys table for individual user API access
-- This is separate from org-level api_keys used for white-label
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CREATE USER API KEYS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CREATE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Service role has full access to user_api_keys" ON user_api_keys;

CREATE POLICY "Users can view own API keys"
ON user_api_keys FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own API keys"
ON user_api_keys FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
ON user_api_keys FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
ON user_api_keys FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to user_api_keys"
ON user_api_keys FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CREATE API REQUEST LOGS TABLE (for tracking actual API usage)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES user_api_keys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_request_logs(created_at);

-- Enable RLS
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_request_logs
DROP POLICY IF EXISTS "Users can view own API logs" ON api_request_logs;
DROP POLICY IF EXISTS "Service role has full access to api_request_logs" ON api_request_logs;

CREATE POLICY "Users can view own API logs"
ON api_request_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to api_request_logs"
ON api_request_logs FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. CREATE FUNCTION TO VALIDATE API KEY
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validate_user_api_key(p_key_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  key_id UUID,
  scopes TEXT[],
  is_valid BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    uak.user_id,
    uak.id as key_id,
    uak.scopes,
    (uak.is_active = true AND (uak.expires_at IS NULL OR uak.expires_at > now())) as is_valid
  FROM user_api_keys uak
  WHERE uak.key_hash = p_key_hash;

  -- Update last_used_at
  UPDATE user_api_keys SET last_used_at = now() WHERE key_hash = p_key_hash;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY:
-- - Created user_api_keys table for individual user API access
-- - Created api_request_logs table for tracking API usage
-- - Added RLS policies for data isolation
-- - Added validate_user_api_key function
-- ═══════════════════════════════════════════════════════════════════════════════
