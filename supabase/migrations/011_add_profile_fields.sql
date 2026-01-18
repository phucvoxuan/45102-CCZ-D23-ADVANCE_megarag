-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Add additional profile fields for user profile page
-- Adds phone, organization_name, job_title columns to profiles table
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ADD NEW COLUMNS TO PROFILES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add phone column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add organization_name column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Add job_title column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add updated_at column if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. CREATE TRIGGER TO AUTO-UPDATE updated_at
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ENSURE RLS POLICIES FOR PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for new users)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Service role has full access (for admin operations)
CREATE POLICY "Service role has full access to profiles"
ON profiles FOR ALL
USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY:
-- - Added phone, organization_name, job_title, updated_at columns
-- - Created trigger for auto-updating updated_at
-- - Ensured RLS policies for profile access
-- ═══════════════════════════════════════════════════════════════════════════════
