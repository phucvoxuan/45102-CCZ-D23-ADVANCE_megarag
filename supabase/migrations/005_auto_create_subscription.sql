-- ============================================
-- Migration: Auto-create FREE subscription for new users
-- ============================================
-- This migration creates a trigger that automatically creates
-- a FREE subscription when a new user signs up.
-- ============================================

-- ============================================
-- 1. Add payment_provider column if not exists
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscriptions'
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.subscriptions
    ADD COLUMN payment_provider TEXT DEFAULT 'free';
  END IF;
END $$;

-- ============================================
-- 2. Function to create FREE subscription for new users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Create FREE subscription for new user
  INSERT INTO public.subscriptions (
    user_id,
    plan_name,
    status,
    payment_provider,
    billing_cycle,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    'FREE',
    'active',
    'free',
    'monthly',
    NOW(),
    -- FREE plan doesn't expire, set far future
    NOW() + INTERVAL '100 years'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Create trigger on auth.users
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger to auto-create subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- ============================================
-- 4. Add unique constraint on user_id if not exists
-- ============================================

-- First check if constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    -- Add unique constraint only if user_id is not null
    ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, ignore
END $$;

-- ============================================
-- 5. Backfill: Create FREE subscription for existing users without one
-- ============================================

INSERT INTO public.subscriptions (
  user_id,
  plan_name,
  status,
  payment_provider,
  billing_cycle,
  current_period_start,
  current_period_end
)
SELECT
  u.id,
  'FREE',
  'active',
  'free',
  'monthly',
  NOW(),
  NOW() + INTERVAL '100 years'
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
WHERE s.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Done!
-- ============================================
-- After running this migration:
-- 1. All existing users will have a FREE subscription
-- 2. New users will automatically get a FREE subscription on signup
-- ============================================
