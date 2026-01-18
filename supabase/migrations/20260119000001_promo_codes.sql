-- ============================================
-- Promo Codes System for Marketing Campaigns
-- Supports Payhip (primary) and Stripe (future)
-- ============================================

-- ============================================
-- 1. Promo Codes Table
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Code info
  code TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Discount type: 'percent' or 'amount'
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL,

  -- Provider info (can have both or one)
  payhip_coupon_id TEXT,
  stripe_coupon_id TEXT UNIQUE,
  stripe_promo_code_id TEXT UNIQUE,

  -- Usage limits
  max_redemptions INTEGER, -- NULL = unlimited
  times_redeemed INTEGER DEFAULT 0,

  -- Validity period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Restrictions (optional)
  applies_to_plans TEXT[], -- NULL = all plans, or ['STARTER', 'PRO']
  minimum_amount INTEGER, -- minimum purchase amount in cents
  first_time_only BOOLEAN DEFAULT FALSE,

  -- Campaign tracking
  campaign_name TEXT,
  campaign_notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Promo Code Redemptions Table (History)
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Transaction info from payment provider
  payhip_sale_id TEXT,
  stripe_invoice_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Amount details (in cents)
  discount_amount INTEGER NOT NULL,
  original_amount INTEGER NOT NULL,
  final_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',

  -- Plan purchased
  plan_name TEXT,

  -- Timestamps
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_campaign ON promo_codes(campaign_name);
CREATE INDEX IF NOT EXISTS idx_promo_codes_payhip ON promo_codes(payhip_coupon_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe ON promo_codes(stripe_coupon_id);

CREATE INDEX IF NOT EXISTS idx_redemptions_promo_code ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_date ON promo_code_redemptions(redeemed_at DESC);

-- ============================================
-- 4. Enable Row Level Security
-- ============================================
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage promo codes (System Admin via API)
CREATE POLICY "Service role manages promo codes"
  ON promo_codes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages redemptions"
  ON promo_code_redemptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. Updated_at Trigger
-- ============================================
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Function to increment redemption count
-- ============================================
CREATE OR REPLACE FUNCTION increment_promo_redemption(p_promo_code_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes
  SET times_redeemed = times_redeemed + 1,
      updated_at = NOW()
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Insert Payhip Promo Codes (Initial Data)
-- ============================================
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_redemptions, valid_until, campaign_name, campaign_notes, is_active)
VALUES
  -- 20% off - New users welcome
  ('WELCOME20AIDORAG', '20% discount for new users', 'percent', 20.00, NULL, '2027-02-14 23:59:59+00', 'LAUNCHING-AIDORAG-MVP-20260214', 'Welcome offer for new users signing up', true),

  -- 30% off - Launch campaign (limited 500 uses)
  ('LAUNCH30AIDORAG', '30% discount for launch campaign', 'percent', 30.00, 500, '2026-08-14 23:59:59+00', 'LAUNCHING-AIDORAG-MVP-20260214', 'Launch promotion - limited to 500 redemptions', true),

  -- 50% off - VIP customers (limited 50 uses)
  ('VIP50AIDORAG', '50% discount for VIP customers', 'percent', 50.00, 50, '2026-05-14 23:59:59+00', 'LAUNCHING-AIDORAG-MVP-20260214', 'VIP exclusive offer - limited availability', true),

  -- 99% off - Beta testers (limited 10 uses)
  ('BETA99AIDORAG', '99% discount for beta testers', 'percent', 99.00, 10, '2026-02-28 23:59:59+00', 'LAUNCHING-AIDORAG-MVP-20260214', 'Special thanks to beta testers - extremely limited', true)

ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  max_redemptions = EXCLUDED.max_redemptions,
  valid_until = EXCLUDED.valid_until,
  campaign_name = EXCLUDED.campaign_name,
  campaign_notes = EXCLUDED.campaign_notes,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- Done! Promo codes system ready.
-- ============================================
