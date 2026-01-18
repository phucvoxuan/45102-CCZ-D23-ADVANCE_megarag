-- =============================================
-- Widget System Migration
-- Cho phép user STARTER, PRO, BUSINESS tạo chatbot widget
-- Query usage dùng chung với Chat/API
-- =============================================

-- Widget configurations table
CREATE TABLE IF NOT EXISTS chatbot_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Widget identity
  name VARCHAR(100) NOT NULL,
  widget_key VARCHAR(64) UNIQUE NOT NULL,

  -- Appearance
  theme JSONB DEFAULT '{
    "primaryColor": "#3B82F6",
    "position": "bottom-right",
    "buttonSize": "60px",
    "borderRadius": "16px"
  }'::jsonb,

  -- Content (bilingual)
  bot_name VARCHAR(100) DEFAULT 'AI Assistant',
  bot_avatar_url VARCHAR(500),
  welcome_message_en TEXT DEFAULT 'Hi! How can I help you today?',
  welcome_message_vi TEXT DEFAULT 'Xin chào! Tôi có thể giúp gì cho bạn?',
  placeholder_en VARCHAR(255) DEFAULT 'Type your message...',
  placeholder_vi VARCHAR(255) DEFAULT 'Nhập tin nhắn...',

  -- Behavior
  default_language VARCHAR(10) DEFAULT 'vi',
  auto_open_delay INTEGER DEFAULT 0,
  require_email BOOLEAN DEFAULT false,

  -- Branding (based on plan)
  show_powered_by BOOLEAN DEFAULT true, -- STARTER: true, PRO/BUSINESS: configurable
  custom_logo_url VARCHAR(500), -- PRO/BUSINESS only

  -- RAG Settings
  knowledge_base_ids UUID[] DEFAULT '{}',
  rag_mode VARCHAR(20) DEFAULT 'hybrid',

  -- Domain restrictions
  allowed_domains TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Analytics
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget conversations (visitor sessions)
CREATE TABLE IF NOT EXISTS widget_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES chatbot_widgets(id) ON DELETE CASCADE NOT NULL,

  -- Visitor info
  visitor_id VARCHAR(100) NOT NULL,
  visitor_email VARCHAR(255),
  visitor_name VARCHAR(100),
  visitor_metadata JSONB DEFAULT '{}'::jsonb,

  -- Context
  page_url TEXT,
  page_title VARCHAR(255),

  -- Status
  status VARCHAR(20) DEFAULT 'active',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget messages
CREATE TABLE IF NOT EXISTS widget_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES widget_conversations(id) ON DELETE CASCADE NOT NULL,

  role VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,

  -- RAG metadata
  citations JSONB DEFAULT '[]'::jsonb,
  rag_mode VARCHAR(20),

  -- Feedback
  feedback VARCHAR(20),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chatbot_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_widgets
CREATE POLICY "Users can view own widgets" ON chatbot_widgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create widgets" ON chatbot_widgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own widgets" ON chatbot_widgets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own widgets" ON chatbot_widgets
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for conversations (owner can view)
CREATE POLICY "Widget owners can view conversations" ON widget_conversations
  FOR SELECT USING (
    widget_id IN (SELECT id FROM chatbot_widgets WHERE user_id = auth.uid())
  );

-- RLS Policies for messages (owner can view)
CREATE POLICY "Widget owners can view messages" ON widget_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT wc.id FROM widget_conversations wc
      JOIN chatbot_widgets cw ON wc.widget_id = cw.id
      WHERE cw.user_id = auth.uid()
    )
  );

-- Public insert policies (for widget API - uses service role)
-- These are handled via service role client, not RLS

-- Indexes
CREATE INDEX IF NOT EXISTS idx_widgets_user ON chatbot_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_key ON chatbot_widgets(widget_key);
CREATE INDEX IF NOT EXISTS idx_widgets_org ON chatbot_widgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_widget ON widget_conversations(widget_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON widget_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON widget_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON widget_messages(created_at DESC);

-- Function to generate widget key
CREATE OR REPLACE FUNCTION generate_widget_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'wgt_' || encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to increment widget stats
CREATE OR REPLACE FUNCTION increment_widget_stats(
  p_widget_id UUID,
  p_is_new_conversation BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  UPDATE chatbot_widgets
  SET
    total_messages = total_messages + 1,
    total_conversations = CASE WHEN p_is_new_conversation THEN total_conversations + 1 ELSE total_conversations END,
    updated_at = NOW()
  WHERE id = p_widget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate widget by key
CREATE OR REPLACE FUNCTION get_widget_by_key(p_widget_key TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  name VARCHAR,
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
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cw.id, cw.user_id, cw.organization_id, cw.name, cw.theme,
    cw.bot_name, cw.bot_avatar_url, cw.welcome_message_en, cw.welcome_message_vi,
    cw.placeholder_en, cw.placeholder_vi, cw.default_language, cw.auto_open_delay,
    cw.show_powered_by, cw.custom_logo_url, cw.knowledge_base_ids, cw.rag_mode,
    cw.allowed_domains, cw.is_active
  FROM chatbot_widgets cw
  WHERE cw.widget_key = p_widget_key AND cw.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
