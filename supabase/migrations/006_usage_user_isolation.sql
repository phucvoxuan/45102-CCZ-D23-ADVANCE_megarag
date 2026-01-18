-- ============================================
-- PHASE A3: Usage Tables Update for User Isolation
-- Adds user_id support and pages_count tracking
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Add user_id and pages_count to usage_records
-- ============================================

-- Add user_id column (nullable to maintain backward compatibility)
ALTER TABLE usage_records
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add pages_count column
ALTER TABLE usage_records
ADD COLUMN IF NOT EXISTS pages_count INTEGER DEFAULT 0;

-- Make organization_id nullable (we now support both user_id and org_id)
ALTER TABLE usage_records
ALTER COLUMN organization_id DROP NOT NULL;

-- Add constraint to ensure at least one of user_id or organization_id is set
ALTER TABLE usage_records
DROP CONSTRAINT IF EXISTS usage_record_owner_check;

ALTER TABLE usage_records
ADD CONSTRAINT usage_record_owner_check CHECK (
  user_id IS NOT NULL OR organization_id IS NOT NULL
);

-- ============================================
-- 2. Create unique index for user_id + period_start
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_user_period
ON usage_records(user_id, period_start)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_records_user_id
ON usage_records(user_id);

-- ============================================
-- 3. Update RLS Policies to support user_id
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_records;
DROP POLICY IF EXISTS "Service role can manage usage" ON usage_records;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_records;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_records;

-- Create new policies that support both user_id and organization_id
CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own usage"
  ON usage_records FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own usage"
  ON usage_records FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage usage"
  ON usage_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 4. Atomic increment/decrement functions for user_id
-- ============================================

-- Function to increment usage atomically (supports user_id)
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_column TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate period end (1 month from start)
  v_period_end := p_period_start + INTERVAL '1 month';

  -- Upsert usage record
  INSERT INTO usage_records (user_id, period_start, period_end, documents_count, pages_count, queries_count, storage_bytes)
  VALUES (
    p_user_id,
    p_period_start,
    v_period_end,
    0, 0, 0, 0
  )
  ON CONFLICT (user_id, period_start) WHERE user_id IS NOT NULL
  DO NOTHING;

  -- Increment the specified column
  EXECUTE format(
    'UPDATE usage_records SET %I = COALESCE(%I, 0) + $1, updated_at = NOW()
     WHERE user_id = $2 AND period_start = $3',
    p_column, p_column
  ) USING p_amount, p_user_id, p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage atomically
CREATE OR REPLACE FUNCTION decrement_usage(
  p_user_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_column TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE usage_records SET %I = GREATEST(0, COALESCE(%I, 0) - $1), updated_at = NOW()
     WHERE user_id = $2 AND period_start = $3',
    p_column, p_column
  ) USING p_amount, p_user_id, p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Helper functions for user usage
-- ============================================

-- Function to get user's total document count (real-time from documents table)
CREATE OR REPLACE FUNCTION get_user_document_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM documents
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get user's total page count (from document_chunks)
CREATE OR REPLACE FUNCTION get_user_page_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(DISTINCT dc.metadata->>'page')::INTEGER, 0)
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE d.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get user's total storage used
CREATE OR REPLACE FUNCTION get_user_storage_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(file_size), 0)::BIGINT
  FROM documents
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_user_current_usage(p_user_id UUID)
RETURNS TABLE (
  documents_count INTEGER,
  pages_count INTEGER,
  queries_count INTEGER,
  storage_bytes BIGINT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.documents_count,
    ur.pages_count,
    ur.queries_count,
    ur.storage_bytes,
    ur.period_start,
    ur.period_end
  FROM usage_records ur
  WHERE ur.user_id = p_user_id
  AND NOW() BETWEEN ur.period_start AND ur.period_end
  ORDER BY ur.period_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Done!
-- ============================================
