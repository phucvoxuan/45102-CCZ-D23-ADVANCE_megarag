-- Migration: Subscription Events Tracking
-- Description: Add tables for tracking subscription changes and revenue snapshots

-- ============================================
-- Subscription Events Table
-- Track upgrades, downgrades, cancellations
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'upgraded', 'downgraded', 'canceled', 'reactivated', 'billing_changed')),
  from_plan TEXT,
  to_plan TEXT,
  from_billing_cycle TEXT,
  to_billing_cycle TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscription_events
CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin access only
CREATE POLICY "Allow system admin full access to subscription_events"
  ON subscription_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'phucvoxuan@gmail.com'
    )
  );

-- ============================================
-- Revenue Snapshots Table
-- Store monthly revenue snapshots for historical reporting
-- ============================================

CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_users INTEGER NOT NULL DEFAULT 0,
  paying_users INTEGER NOT NULL DEFAULT 0,
  free_users INTEGER NOT NULL DEFAULT 0,
  mrr DECIMAL(10,2) NOT NULL DEFAULT 0,
  arr DECIMAL(12,2) NOT NULL DEFAULT 0,
  new_subscriptions INTEGER NOT NULL DEFAULT 0,
  churned_subscriptions INTEGER NOT NULL DEFAULT 0,
  plan_breakdown JSONB DEFAULT '{}',
  billing_cycle_breakdown JSONB DEFAULT '{}',
  provider_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient date-based queries
CREATE INDEX idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date);

-- Enable RLS
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin access only
CREATE POLICY "Allow system admin full access to revenue_snapshots"
  ON revenue_snapshots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'phucvoxuan@gmail.com'
    )
  );

-- ============================================
-- Function: Log Subscription Event
-- ============================================

CREATE OR REPLACE FUNCTION log_subscription_event(
  p_subscription_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_from_plan TEXT DEFAULT NULL,
  p_to_plan TEXT DEFAULT NULL,
  p_from_billing_cycle TEXT DEFAULT NULL,
  p_to_billing_cycle TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO subscription_events (
    subscription_id,
    user_id,
    event_type,
    from_plan,
    to_plan,
    from_billing_cycle,
    to_billing_cycle,
    reason,
    metadata
  ) VALUES (
    p_subscription_id,
    p_user_id,
    p_event_type,
    p_from_plan,
    p_to_plan,
    p_from_billing_cycle,
    p_to_billing_cycle,
    p_reason,
    p_metadata
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ============================================
-- Trigger: Auto-log subscription changes
-- ============================================

CREATE OR REPLACE FUNCTION trigger_log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  -- Determine event type based on changes
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'created';

    INSERT INTO subscription_events (
      subscription_id,
      user_id,
      event_type,
      to_plan,
      to_billing_cycle
    ) VALUES (
      NEW.id,
      NEW.user_id,
      v_event_type,
      NEW.plan_name,
      NEW.billing_cycle
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for plan change (upgrade/downgrade)
    IF OLD.plan_name IS DISTINCT FROM NEW.plan_name THEN
      IF NEW.plan_name = 'BUSINESS' OR
         (NEW.plan_name = 'PRO' AND OLD.plan_name = 'STARTER') OR
         (NEW.plan_name = 'STARTER' AND OLD.plan_name = 'FREE') THEN
        v_event_type := 'upgraded';
      ELSE
        v_event_type := 'downgraded';
      END IF;

      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type,
        from_plan,
        to_plan,
        from_billing_cycle,
        to_billing_cycle
      ) VALUES (
        NEW.id,
        NEW.user_id,
        v_event_type,
        OLD.plan_name,
        NEW.plan_name,
        OLD.billing_cycle,
        NEW.billing_cycle
      );

    -- Check for billing cycle change
    ELSIF OLD.billing_cycle IS DISTINCT FROM NEW.billing_cycle THEN
      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type,
        from_plan,
        to_plan,
        from_billing_cycle,
        to_billing_cycle
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'billing_changed',
        NEW.plan_name,
        NEW.plan_name,
        OLD.billing_cycle,
        NEW.billing_cycle
      );

    -- Check for cancellation
    ELSIF OLD.status != 'canceled' AND NEW.status = 'canceled' THEN
      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type,
        from_plan,
        to_plan
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'canceled',
        OLD.plan_name,
        NULL
      );

    -- Check for reactivation
    ELSIF OLD.status = 'canceled' AND NEW.status = 'active' THEN
      INSERT INTO subscription_events (
        subscription_id,
        user_id,
        event_type,
        from_plan,
        to_plan
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'reactivated',
        NULL,
        NEW.plan_name
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_subscription_change();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE subscription_events IS 'Tracks all subscription lifecycle events for analytics and reporting';
COMMENT ON TABLE revenue_snapshots IS 'Stores daily/monthly revenue snapshots for historical trending';
COMMENT ON FUNCTION log_subscription_event IS 'Manually log a subscription event';
COMMENT ON FUNCTION trigger_log_subscription_change IS 'Automatically logs subscription changes';
