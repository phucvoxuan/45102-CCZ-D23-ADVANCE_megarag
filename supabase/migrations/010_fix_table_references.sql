-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Fix table name references (document_chunks -> chunks)
--
-- ISSUE: Some functions reference "document_chunks" but the actual table is "chunks"
-- This causes silent failures when querying the database
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CREATE ALIAS VIEW (document_chunks -> chunks)
-- This ensures backward compatibility for any code referencing document_chunks
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW document_chunks AS
SELECT * FROM chunks;

-- Grant same permissions as chunks table
GRANT SELECT ON document_chunks TO authenticated;
GRANT SELECT ON document_chunks TO anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. FIX get_user_page_count FUNCTION
-- Update to use correct table name (chunks)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_page_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM chunks c
  WHERE c.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY:
-- - Created document_chunks view as alias for chunks table
-- - Fixed get_user_page_count function to use correct table name
-- ═══════════════════════════════════════════════════════════════════════════════
