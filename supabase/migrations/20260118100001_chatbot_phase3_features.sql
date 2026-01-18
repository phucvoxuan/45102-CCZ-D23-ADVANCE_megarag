-- =============================================
-- Phase 3 - Advanced Features Migration
-- Adds appearance customization and security columns
-- =============================================

-- =============================================
-- 1. APPEARANCE SETTINGS
-- =============================================

-- Colors
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#3b82f6';
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#60a5fa';
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#ffffff';
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS text_color VARCHAR(20) DEFAULT '#1f2937';

-- Typography & Shape
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS border_radius INTEGER DEFAULT 12;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'system';
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(10) DEFAULT 'light'; -- light, dark, auto

-- =============================================
-- 2. SECURITY SETTINGS
-- =============================================

-- Domain restriction toggle (allowed_domains column already exists)
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS domain_restriction_enabled BOOLEAN DEFAULT false;

-- =============================================
-- 3. UPDATE get_widget_by_key FUNCTION TO INCLUDE NEW FIELDS
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
  -- Bot settings
  answer_length VARCHAR,
  answer_tone VARCHAR,
  auto_reply BOOLEAN,
  show_answer_source BOOLEAN,
  allow_emoji BOOLEAN,
  unknown_answer_action VARCHAR,
  unknown_answer_text TEXT,
  -- Launch settings
  button_position VARCHAR,
  button_draggable BOOLEAN,
  auto_open_chat BOOLEAN,
  custom_css TEXT,
  button_icon_url VARCHAR,
  open_in_new_tab BOOLEAN,
  -- Domain settings
  custom_domain VARCHAR,
  chat_web_url VARCHAR,
  favicon_url VARCHAR,
  meta_title VARCHAR,
  meta_description VARCHAR,
  -- Webhook settings
  webhook_url VARCHAR,
  webhook_events TEXT[],
  -- Appearance settings
  primary_color VARCHAR,
  secondary_color VARCHAR,
  background_color VARCHAR,
  text_color VARCHAR,
  border_radius INTEGER,
  font_family VARCHAR,
  theme_mode VARCHAR,
  -- Security settings
  domain_restriction_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cw.id, cw.user_id, cw.organization_id, cw.name, cw.widget_key, cw.theme,
    cw.bot_name, cw.bot_avatar_url, cw.welcome_message_en, cw.welcome_message_vi,
    cw.placeholder_en, cw.placeholder_vi, cw.default_language, cw.auto_open_delay,
    cw.show_powered_by, cw.custom_logo_url, cw.knowledge_base_ids, cw.rag_mode,
    cw.allowed_domains, cw.is_active, cw.system_prompt, cw.max_tokens,
    -- Bot settings
    cw.answer_length, cw.answer_tone, cw.auto_reply, cw.show_answer_source,
    cw.allow_emoji, cw.unknown_answer_action, cw.unknown_answer_text,
    -- Launch settings
    cw.button_position, cw.button_draggable, cw.auto_open_chat, cw.custom_css,
    cw.button_icon_url, cw.open_in_new_tab,
    -- Domain settings
    cw.custom_domain, cw.chat_web_url, cw.favicon_url, cw.meta_title, cw.meta_description,
    -- Webhook settings
    cw.webhook_url, cw.webhook_events,
    -- Appearance settings
    cw.primary_color, cw.secondary_color, cw.background_color, cw.text_color,
    cw.border_radius, cw.font_family, cw.theme_mode,
    -- Security settings
    cw.domain_restriction_enabled
  FROM chatbot_widgets cw
  WHERE cw.widget_key = p_widget_key AND cw.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
