-- Add missing columns to chatbot_widgets table
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE chatbot_widgets ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2048;

-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS get_widget_by_key(TEXT);

-- Recreate get_widget_by_key function with new columns
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
  max_tokens INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cw.id, cw.user_id, cw.organization_id, cw.name, cw.widget_key, cw.theme,
    cw.bot_name, cw.bot_avatar_url, cw.welcome_message_en, cw.welcome_message_vi,
    cw.placeholder_en, cw.placeholder_vi, cw.default_language, cw.auto_open_delay,
    cw.show_powered_by, cw.custom_logo_url, cw.knowledge_base_ids, cw.rag_mode,
    cw.allowed_domains, cw.is_active, cw.system_prompt, cw.max_tokens
  FROM chatbot_widgets cw
  WHERE cw.widget_key = p_widget_key AND cw.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
