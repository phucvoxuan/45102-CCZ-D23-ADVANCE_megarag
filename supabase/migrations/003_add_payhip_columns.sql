-- Migration: Add Payhip payment provider support
-- This adds columns to support dual payment gateways (Stripe + Payhip)

-- ============================================
-- 1. Add Payhip columns to subscriptions table
-- ============================================

-- Payhip subscription ID (from Payhip webhook)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payhip_subscription_id TEXT;

-- Payhip license key (for license verification)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payhip_license_key TEXT;

-- Payment provider identifier
-- Allows tracking which provider the subscription came from
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.payhip_subscription_id IS 'Payhip subscription ID for recurring payments';
COMMENT ON COLUMN subscriptions.payhip_license_key IS 'Payhip license key for verification';
COMMENT ON COLUMN subscriptions.payment_provider IS 'Payment provider: stripe or payhip';

-- ============================================
-- 2. Create indexes for Payhip lookups
-- ============================================

-- Index for finding subscriptions by Payhip ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_payhip_sub
ON subscriptions(payhip_subscription_id)
WHERE payhip_subscription_id IS NOT NULL;

-- Index for filtering by payment provider
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider
ON subscriptions(payment_provider);

-- ============================================
-- 3. Add constraint to validate payment_provider values
-- ============================================

-- Check constraint for valid provider values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_payment_provider_check'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_payment_provider_check
    CHECK (payment_provider IN ('stripe', 'payhip'));
  END IF;
END $$;

-- ============================================
-- 4. Update existing subscriptions to have provider
-- ============================================

-- Set existing subscriptions to 'stripe' provider
UPDATE subscriptions
SET payment_provider = 'stripe'
WHERE payment_provider IS NULL;

-- ============================================
-- 5. Add email column to profiles if not exists
-- (Needed for Payhip webhook user lookup)
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Copy emails from auth.users if profiles.email is empty
-- (This helps with Payhip webhook user matching)
DO $$
BEGIN
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email)
WHERE email IS NOT NULL;

-- ============================================
-- Summary of changes:
-- ============================================
-- 1. Added payhip_subscription_id column to subscriptions
-- 2. Added payhip_license_key column to subscriptions
-- 3. Added payment_provider column to subscriptions (default: 'stripe')
-- 4. Created indexes for efficient lookups
-- 5. Added constraint for valid provider values
-- 6. Added email column to profiles for webhook matching
-- ============================================
