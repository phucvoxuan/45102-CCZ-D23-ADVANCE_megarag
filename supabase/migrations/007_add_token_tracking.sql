-- ============================================
-- Migration: Add LLM Token Tracking Columns
-- Tracks input and output tokens separately for cost analysis
-- ============================================

-- ============================================
-- 1. Add token columns to usage_records
-- ============================================

-- Add tokens_input column (input/prompt tokens)
ALTER TABLE usage_records
ADD COLUMN IF NOT EXISTS tokens_input BIGINT DEFAULT 0;

-- Add tokens_output column (output/completion tokens)
ALTER TABLE usage_records
ADD COLUMN IF NOT EXISTS tokens_output BIGINT DEFAULT 0;

-- ============================================
-- 2. Update increment_usage function to handle token columns
-- ============================================

-- The existing increment_usage function already supports dynamic columns,
-- so tokens_input and tokens_output can be incremented using:
--   increment_usage(user_id, period_start, 'tokens_input', amount)
--   increment_usage(user_id, period_start, 'tokens_output', amount)

-- ============================================
-- 3. Helper function to increment both token types at once
-- ============================================

CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id UUID,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_input_tokens BIGINT,
  p_output_tokens BIGINT
)
RETURNS VOID AS $$
DECLARE
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate period end (1 month from start)
  v_period_end := p_period_start + INTERVAL '1 month';

  -- Upsert usage record
  INSERT INTO usage_records (
    user_id, period_start, period_end,
    documents_count, pages_count, queries_count, storage_bytes,
    tokens_input, tokens_output
  )
  VALUES (
    p_user_id, p_period_start, v_period_end,
    0, 0, 0, 0, 0, 0
  )
  ON CONFLICT (user_id, period_start) WHERE user_id IS NOT NULL
  DO NOTHING;

  -- Increment both token columns
  UPDATE usage_records
  SET
    tokens_input = COALESCE(tokens_input, 0) + p_input_tokens,
    tokens_output = COALESCE(tokens_output, 0) + p_output_tokens,
    updated_at = NOW()
  WHERE user_id = p_user_id AND period_start = p_period_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Update get_user_current_usage to include tokens
-- ============================================

CREATE OR REPLACE FUNCTION get_user_current_usage(p_user_id UUID)
RETURNS TABLE (
  documents_count INTEGER,
  pages_count INTEGER,
  queries_count INTEGER,
  storage_bytes BIGINT,
  tokens_input BIGINT,
  tokens_output BIGINT,
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
    COALESCE(ur.tokens_input, 0)::BIGINT AS tokens_input,
    COALESCE(ur.tokens_output, 0)::BIGINT AS tokens_output,
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
