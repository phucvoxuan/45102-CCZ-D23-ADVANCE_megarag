-- =============================================
-- Enhanced Widget System Migration - Phase 1
-- Thêm các tính năng mới cho chatbot widgets
-- =============================================

-- =============================================
-- 1. ADD NEW COLUMNS TO chatbot_widgets
-- =============================================

-- Bot Settings
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS answer_length VARCHAR(20) DEFAULT 'normal'; -- short, normal, long
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS answer_tone VARCHAR(30) DEFAULT 'professional'; -- professional, gentle, direct, empathetic, friendly
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS auto_reply BOOLEAN DEFAULT true;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS show_answer_source BOOLEAN DEFAULT true;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS allow_emoji BOOLEAN DEFAULT false;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS auto_suggestion BOOLEAN DEFAULT true;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS collect_visitor_info BOOLEAN DEFAULT false;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS unknown_answer_action VARCHAR(30) DEFAULT 'ai_generated'; -- input_answer, ai_generated, no_reply, trigger_workflow
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS unknown_answer_text TEXT DEFAULT 'Sorry, I don''t have enough information to answer this question.';

-- Launch Bot Settings
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS button_position VARCHAR(20) DEFAULT 'bottom-right'; -- bottom-left, bottom-right
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS button_draggable BOOLEAN DEFAULT false;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS auto_open_chat BOOLEAN DEFAULT false;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS button_icon_url VARCHAR(500);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS open_in_new_tab BOOLEAN DEFAULT false;

-- Domain Settings
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS chat_web_url VARCHAR(500);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(500);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS meta_title VARCHAR(100);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS meta_description VARCHAR(255);

-- Webhook Settings
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT '{}'; -- new_message, no_answer, api_call

-- =============================================
-- 2. CREATE WIDGET FAQS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS widget_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES chatbot_widgets(id) ON DELETE CASCADE NOT NULL,

  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  source VARCHAR(20) DEFAULT 'manual', -- manual, imported

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE widget_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for widget_faqs
CREATE POLICY "Widget owners can view FAQs" ON widget_faqs
  FOR SELECT USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

CREATE POLICY "Widget owners can create FAQs" ON widget_faqs
  FOR INSERT WITH CHECK (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

CREATE POLICY "Widget owners can update FAQs" ON widget_faqs
  FOR UPDATE USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

CREATE POLICY "Widget owners can delete FAQs" ON widget_faqs
  FOR DELETE USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_widget_faqs_widget ON widget_faqs(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_faqs_status ON widget_faqs(status);

-- =============================================
-- 3. CREATE WIDGET ANALYTICS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS widget_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES chatbot_widgets(id) ON DELETE CASCADE NOT NULL,

  -- Date for aggregation
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Conversation metrics
  new_conversations INTEGER DEFAULT 0,
  closed_conversations INTEGER DEFAULT 0,

  -- Message metrics
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  bot_messages INTEGER DEFAULT 0,

  -- Q&A metrics
  known_questions INTEGER DEFAULT 0,
  unknown_questions INTEGER DEFAULT 0,

  -- Resolution metrics
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,

  -- Customer metrics
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(widget_id, date)
);

-- Enable RLS
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for widget_analytics
CREATE POLICY "Widget owners can view analytics" ON widget_analytics
  FOR SELECT USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- Service role can insert/update analytics
CREATE POLICY "Service role can manage analytics" ON widget_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_widget_analytics_widget ON widget_analytics(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_date ON widget_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_widget_date ON widget_analytics(widget_id, date DESC);

-- =============================================
-- 4. UPDATE get_widget_by_key FUNCTION
-- =============================================

DROP FUNCTION IF EXISTS get_widget_by_key(TEXT);

CREATE OR REPLACE FUNCTION get_widget_by_key(p_widget_key TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  name VARCHAR,
  widget_key VARCHAR,
  theme JSONB,
  bot_name VARCHAR,
  bot_avatar_url VARCHAR,
  welcome_message_en TEXT,
  welcome_message_vi TEXT,
  placeholder_en VARCHAR,
  placeholder_vi VARCHAR,
  default_language VARCHAR,
  auto_open_delay INTEGER,
  show_powered_by BOOLEAN,
  custom_logo_url VARCHAR,
  knowledge_base_ids UUID[],
  rag_mode VARCHAR,
  allowed_domains TEXT[],
  is_active BOOLEAN,
  system_prompt TEXT,
  max_tokens INTEGER,
  -- New fields
  answer_length VARCHAR,
  answer_tone VARCHAR,
  auto_reply BOOLEAN,
  show_answer_source BOOLEAN,
  allow_emoji BOOLEAN,
  unknown_answer_action VARCHAR,
  unknown_answer_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cw.id, cw.user_id, cw.organization_id, cw.name, cw.widget_key, cw.theme,
    cw.bot_name, cw.bot_avatar_url, cw.welcome_message_en, cw.welcome_message_vi,
    cw.placeholder_en, cw.placeholder_vi, cw.default_language, cw.auto_open_delay,
    cw.show_powered_by, cw.custom_logo_url, cw.knowledge_base_ids, cw.rag_mode,
    cw.allowed_domains, cw.is_active, cw.system_prompt, cw.max_tokens,
    cw.answer_length, cw.answer_tone, cw.auto_reply, cw.show_answer_source,
    cw.allow_emoji, cw.unknown_answer_action, cw.unknown_answer_text
  FROM chatbot_widgets cw
  WHERE cw.widget_key = p_widget_key AND cw.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNCTION TO UPDATE DAILY ANALYTICS
-- =============================================

CREATE OR REPLACE FUNCTION update_widget_daily_analytics(
  p_widget_id UUID,
  p_metric VARCHAR(50),
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update the analytics record
  INSERT INTO widget_analytics (widget_id, date)
  VALUES (p_widget_id, v_date)
  ON CONFLICT (widget_id, date) DO NOTHING;

  -- Update the specific metric
  EXECUTE format(
    'UPDATE widget_analytics SET %I = %I + $1, updated_at = NOW() WHERE widget_id = $2 AND date = $3',
    p_metric, p_metric
  ) USING p_increment, p_widget_id, v_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. FUNCTION TO GET WIDGET ANALYTICS SUMMARY
-- =============================================

CREATE OR REPLACE FUNCTION get_widget_analytics_summary(
  p_widget_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_conversations BIGINT,
  total_messages BIGINT,
  known_questions BIGINT,
  unknown_questions BIGINT,
  positive_feedback BIGINT,
  negative_feedback BIGINT,
  new_visitors BIGINT,
  resolution_rate NUMERIC,
  known_question_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(wa.new_conversations), 0)::BIGINT as total_conversations,
    COALESCE(SUM(wa.total_messages), 0)::BIGINT as total_messages,
    COALESCE(SUM(wa.known_questions), 0)::BIGINT as known_questions,
    COALESCE(SUM(wa.unknown_questions), 0)::BIGINT as unknown_questions,
    COALESCE(SUM(wa.positive_feedback), 0)::BIGINT as positive_feedback,
    COALESCE(SUM(wa.negative_feedback), 0)::BIGINT as negative_feedback,
    COALESCE(SUM(wa.new_visitors), 0)::BIGINT as new_visitors,
    CASE
      WHEN COALESCE(SUM(wa.positive_feedback) + SUM(wa.negative_feedback), 0) > 0
      THEN ROUND(SUM(wa.positive_feedback)::NUMERIC / (SUM(wa.positive_feedback) + SUM(wa.negative_feedback)) * 100, 2)
      ELSE 0
    END as resolution_rate,
    CASE
      WHEN COALESCE(SUM(wa.known_questions) + SUM(wa.unknown_questions), 0) > 0
      THEN ROUND(SUM(wa.known_questions)::NUMERIC / (SUM(wa.known_questions) + SUM(wa.unknown_questions)) * 100, 2)
      ELSE 0
    END as known_question_rate
  FROM widget_analytics wa
  WHERE wa.widget_id = p_widget_id
    AND wa.date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. ADD SERVICE ROLE POLICIES FOR ADMIN OPERATIONS
-- =============================================

-- Allow service role full access to chatbot_widgets
DROP POLICY IF EXISTS "Service role has full access to chatbot_widgets" ON chatbot_widgets;
CREATE POLICY "Service role has full access to chatbot_widgets" ON chatbot_widgets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role full access to widget_conversations
DROP POLICY IF EXISTS "Service role has full access to widget_conversations" ON widget_conversations;
CREATE POLICY "Service role has full access to widget_conversations" ON widget_conversations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role full access to widget_messages
DROP POLICY IF EXISTS "Service role has full access to widget_messages" ON widget_messages;
CREATE POLICY "Service role has full access to widget_messages" ON widget_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role full access to widget_faqs
DROP POLICY IF EXISTS "Service role has full access to widget_faqs" ON widget_faqs;
CREATE POLICY "Service role has full access to widget_faqs" ON widget_faqs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
