-- ============================================
-- PHASE: Add Media Duration Tracking Columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add audio_seconds_used column to usage_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'usage_records'
    AND column_name = 'audio_seconds_used'
  ) THEN
    ALTER TABLE usage_records ADD COLUMN audio_seconds_used INTEGER DEFAULT 0;
    RAISE NOTICE 'Added audio_seconds_used column';
  ELSE
    RAISE NOTICE 'audio_seconds_used column already exists';
  END IF;
END $$;

-- Add video_seconds_used column to usage_records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'usage_records'
    AND column_name = 'video_seconds_used'
  ) THEN
    ALTER TABLE usage_records ADD COLUMN video_seconds_used INTEGER DEFAULT 0;
    RAISE NOTICE 'Added video_seconds_used column';
  ELSE
    RAISE NOTICE 'video_seconds_used column already exists';
  END IF;
END $$;

-- Add pages_count column if not exists (for tracking pages separately from documents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'usage_records'
    AND column_name = 'pages_count'
  ) THEN
    ALTER TABLE usage_records ADD COLUMN pages_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added pages_count column';
  ELSE
    RAISE NOTICE 'pages_count column already exists';
  END IF;
END $$;

-- Update the get_current_usage function to include new columns
CREATE OR REPLACE FUNCTION get_current_usage(p_org_id UUID)
RETURNS TABLE (
  documents_count INTEGER,
  pages_count INTEGER,
  queries_count INTEGER,
  storage_bytes BIGINT,
  audio_seconds_used INTEGER,
  video_seconds_used INTEGER,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.documents_count,
    COALESCE(ur.pages_count, 0) as pages_count,
    ur.queries_count,
    ur.storage_bytes,
    COALESCE(ur.audio_seconds_used, 0) as audio_seconds_used,
    COALESCE(ur.video_seconds_used, 0) as video_seconds_used,
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
-- After running this migration:
-- 1. audio_seconds_used and video_seconds_used columns track media duration
-- 2. pages_count tracks total pages separately from documents
-- 3. get_current_usage function returns all usage metrics
-- ============================================
