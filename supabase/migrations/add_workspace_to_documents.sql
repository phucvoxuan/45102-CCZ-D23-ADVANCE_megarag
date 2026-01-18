-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Add workspace column to documents table
-- Run this in Supabase SQL Editor to fix schema mismatch
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add workspace column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'workspace'
    ) THEN
        ALTER TABLE documents ADD COLUMN workspace VARCHAR(255) DEFAULT 'default';
        CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace);
        RAISE NOTICE 'Added workspace column to documents table';
    ELSE
        RAISE NOTICE 'workspace column already exists in documents table';
    END IF;
END $$;

-- Update existing rows to have default workspace
UPDATE documents SET workspace = 'default' WHERE workspace IS NULL;

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
