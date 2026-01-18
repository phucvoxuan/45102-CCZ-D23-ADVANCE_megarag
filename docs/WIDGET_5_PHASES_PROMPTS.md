# 🤖 WIDGET CHATBOT - 5 PROMPTS THỰC THI

> **QUAN TRỌNG:** 
> - Thực hiện từng prompt một, không gộp chung
> - Không thay đổi code/workflow hiện tại
> - Widget dùng chung query quota với Chat/API
> - STARTER, PRO, BUSINESS được dùng Widget (FREE không có)

---

# 📋 PHASE 1/5: DATABASE MIGRATION

## MỤC TIÊU
Tạo database tables cho Widget system thông qua Supabase CLI.

## BƯỚC 1: TẠO MIGRATION FILE

```bash
supabase migration new widget_system
```

## BƯỚC 2: THÊM SQL VÀO FILE MIGRATION

Mở file vừa tạo trong `supabase/migrations/` và thêm:

```sql
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
```

## BƯỚC 3: CHẠY MIGRATION

```bash
npm run db:migrate
```

## BƯỚC 4: VERIFY

```bash
npm run db:migrate:status
```

Kiểm tra Supabase Dashboard xem 3 tables đã được tạo:
- chatbot_widgets
- widget_conversations  
- widget_messages

## OUTPUT MONG ĐỢI
- [ ] Migration file được tạo
- [ ] 3 tables mới trong database
- [ ] RLS policies đã enable
- [ ] Functions đã tạo

---

# 📋 PHASE 2/5: WIDGET PUBLIC API

## MỤC TIÊU
Tạo API endpoints cho widget (không cần user login, dùng widget_key).

## LƯU Ý QUAN TRỌNG
- Widget API KHÔNG cần user authentication
- Sử dụng widget_key để identify widget
- PHẢI check domain whitelist
- PHẢI increment usage quota của widget owner
- CORS headers cho cross-domain requests

## BƯỚC 1: TẠO SERVICE CLIENT

Kiểm tra xem đã có `createServiceClient` chưa. Nếu chưa, tạo file:

`src/lib/supabase/service.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// Service client với service_role key - bypass RLS
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

## BƯỚC 2: TẠO WIDGET CONFIG API

Tạo file: `src/app/api/widget/[widgetKey]/config/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// CORS headers for widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;
    const supabase = createServiceClient();
    
    // Get widget config
    const { data: widget, error } = await supabase
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();
    
    if (error || !widget) {
      return NextResponse.json(
        { error: 'Widget not found or inactive' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check domain restriction
    const origin = request.headers.get('origin') || '';
    if (widget.allowed_domains && widget.allowed_domains.length > 0 && origin) {
      try {
        const originDomain = new URL(origin).hostname;
        const isAllowed = widget.allowed_domains.some((domain: string) =>
          originDomain === domain || 
          originDomain.endsWith(`.${domain}`) ||
          domain === '*'
        );
        
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Domain not allowed' },
            { status: 403, headers: corsHeaders }
          );
        }
      } catch {
        // Invalid origin URL, continue
      }
    }
    
    // Return public config only (no sensitive data)
    return NextResponse.json({
      widgetKey,
      theme: widget.theme,
      botName: widget.bot_name,
      botAvatarUrl: widget.bot_avatar_url,
      welcomeMessage: {
        en: widget.welcome_message_en,
        vi: widget.welcome_message_vi
      },
      placeholder: {
        en: widget.placeholder_en,
        vi: widget.placeholder_vi
      },
      defaultLanguage: widget.default_language,
      autoOpenDelay: widget.auto_open_delay,
      showPoweredBy: widget.show_powered_by,
      customLogoUrl: widget.custom_logo_url
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
```

## BƯỚC 3: TẠO WIDGET CHAT API

Tạo file: `src/app/api/widget/[widgetKey]/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;
    const supabase = createServiceClient();
    
    const body = await request.json();
    const {
      message,
      conversationId,
      visitorId,
      visitorEmail,
      visitorName,
      pageUrl,
      pageTitle,
      language = 'vi'
    } = body;
    
    if (!message || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, visitorId' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get widget config
    const { data: widget, error: widgetError } = await supabase
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();
    
    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check usage quota của widget owner
    // Dùng existing usage system
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', widget.user_id)
      .eq('status', 'active')
      .single();
    
    const planName = subscription?.plan_name || 'FREE';
    
    // FREE plan không được dùng widget
    if (planName === 'FREE') {
      return NextResponse.json(
        { error: 'Widget requires STARTER or higher plan' },
        { status: 403, headers: corsHeaders }
      );
    }
    
    // Check query quota (dùng existing usage_records system)
    // Import từ existing usage service nếu có
    // Hoặc check trực tiếp trong database
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('widget_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('widget_id', widget.id)
        .single();
      conversation = data;
    }
    
    const isNewConversation = !conversation;
    
    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('widget_conversations')
        .insert({
          widget_id: widget.id,
          visitor_id: visitorId,
          visitor_email: visitorEmail,
          visitor_name: visitorName,
          page_url: pageUrl,
          page_title: pageTitle,
          visitor_metadata: {
            userAgent: request.headers.get('user-agent'),
            language,
            origin: request.headers.get('origin')
          }
        })
        .select()
        .single();
      
      if (convError) {
        console.error('Create conversation error:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500, headers: corsHeaders }
        );
      }
      conversation = newConv;
    }
    
    // Save user message
    await supabase.from('widget_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message
    });
    
    // Get conversation history for context
    const { data: history } = await supabase
      .from('widget_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);
    
    // Call RAG system
    // TODO: Integrate với existing RAG system (/api/v1/query hoặc internal function)
    // Tạm thời return placeholder
    const ragResponse = await callExistingRAG({
      query: message,
      userId: widget.user_id,
      organizationId: widget.organization_id,
      mode: widget.rag_mode,
      history: history || [],
      knowledgeBaseIds: widget.knowledge_base_ids
    });
    
    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from('widget_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: ragResponse.content,
        citations: ragResponse.citations || [],
        rag_mode: widget.rag_mode
      })
      .select()
      .single();
    
    // Update widget stats
    await supabase.rpc('increment_widget_stats', {
      p_widget_id: widget.id,
      p_is_new_conversation: isNewConversation
    });
    
    // Increment user's query usage (dùng existing system)
    // await incrementUsage(widget.user_id, 'queries', 1);
    
    // Update conversation timestamp
    await supabase
      .from('widget_conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id);
    
    return NextResponse.json({
      conversationId: conversation.id,
      message: {
        id: assistantMsg?.id,
        content: ragResponse.content,
        citations: ragResponse.citations || []
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Widget chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Placeholder - Replace với actual RAG integration
async function callExistingRAG(params: {
  query: string;
  userId: string;
  organizationId: string | null;
  mode: string;
  history: { role: string; content: string }[];
  knowledgeBaseIds: string[];
}) {
  // TODO: Call existing RAG service
  // Option 1: Import và gọi trực tiếp RAG functions
  // Option 2: Internal fetch to /api/v1/query
  // Option 3: Duplicate RAG logic (không khuyến khích)
  
  // Placeholder response
  return {
    content: `Tôi đã nhận được câu hỏi của bạn: "${params.query}". Đây là phản hồi placeholder - cần integrate với RAG system thực.`,
    citations: []
  };
}
```

## BƯỚC 4: TẠO WIDGET HISTORY API (Optional)

Tạo file: `src/app/api/widget/[widgetKey]/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    
    if (!visitorId) {
      return NextResponse.json(
        { error: 'Missing visitorId' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const supabase = createServiceClient();
    
    // Get widget
    const { data: widget } = await supabase
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();
    
    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Get latest conversation
    const { data: conversation } = await supabase
      .from('widget_conversations')
      .select('id')
      .eq('widget_id', widget.id)
      .eq('visitor_id', visitorId)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!conversation) {
      return NextResponse.json({ messages: [] }, { headers: corsHeaders });
    }
    
    // Get messages
    const { data: messages } = await supabase
      .from('widget_messages')
      .select('id, role, content, citations, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    
    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages || []
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Widget history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
```

## OUTPUT MONG ĐỢI
- [ ] createServiceClient đã có/tạo
- [ ] GET /api/widget/[key]/config - trả về widget config
- [ ] POST /api/widget/[key]/chat - nhận message, trả về response
- [ ] GET /api/widget/[key]/history - trả về conversation history
- [ ] CORS headers hoạt động

---

# 📋 PHASE 3/5: EMBEDDABLE WIDGET SCRIPT

## MỤC TIÊU
Tạo JavaScript file có thể embed vào bất kỳ website nào.

## BƯỚC 1: TẠO WIDGET JAVASCRIPT

Tạo file: `public/widget/aidorag-widget.js`

(File JavaScript đầy đủ - khoảng 400 dòng)

```javascript
/**
 * AIDORag Embeddable Chat Widget
 * Version: 1.0.0
 * Usage: <script src="https://aidorag.com/widget/aidorag-widget.js" data-widget-key="wgt_xxx"></script>
 */
(function() {
  'use strict';
  
  // Configuration
  const VERSION = '1.0.0';
  const API_BASE = window.AIDORAG_API_URL || (
    window.location.hostname === 'localhost' 
      ? 'http://localhost:3000' 
      : 'https://aidorag.com'
  );
  
  // Get widget key
  const scriptTag = document.currentScript;
  const widgetKey = scriptTag?.getAttribute('data-widget-key');
  
  if (!widgetKey) {
    console.error('[AIDORag] Missing data-widget-key attribute');
    return;
  }
  
  // State
  let config = null;
  let conversationId = null;
  let isOpen = false;
  let isLoading = false;
  
  // Generate visitor ID
  const getVisitorId = () => {
    let id = localStorage.getItem('aidorag_vid');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('aidorag_vid', id);
    }
    return id;
  };
  const visitorId = getVisitorId();
  
  // Fetch config
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/config`);
      if (!res.ok) throw new Error('Config fetch failed');
      config = await res.json();
      init();
    } catch (err) {
      console.error('[AIDORag]', err);
    }
  };
  
  // Initialize widget
  const init = () => {
    createStyles();
    createWidget();
    loadHistory();
    
    // Auto open
    if (config.autoOpenDelay > 0) {
      setTimeout(() => !isOpen && toggleWidget(), config.autoOpenDelay * 1000);
    }
    
    console.log(`[AIDORag] Widget v${VERSION} initialized`);
  };
  
  // Create styles
  const createStyles = () => {
    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3B82F6';
    const position = theme.position || 'bottom-right';
    const [vert, horiz] = position.split('-');
    
    const style = document.createElement('style');
    style.id = 'aidorag-widget-styles';
    style.textContent = `
      #aidorag-widget {
        position: fixed;
        ${vert}: 20px;
        ${horiz}: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #aidorag-widget * {
        box-sizing: border-box;
      }
      
      .aidorag-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.2s;
      }
      
      .aidorag-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }
      
      .aidorag-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      .aidorag-window {
        display: none;
        position: absolute;
        ${vert}: 76px;
        ${horiz}: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        flex-direction: column;
        overflow: hidden;
      }
      
      .aidorag-window.open {
        display: flex;
        animation: aidorag-slide 0.3s ease;
      }
      
      @keyframes aidorag-slide {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .aidorag-header {
        background: ${primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .aidorag-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      .aidorag-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .aidorag-info { flex: 1; }
      .aidorag-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
      .aidorag-info p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
      
      .aidorag-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
      }
      
      .aidorag-close:hover { opacity: 1; }
      
      .aidorag-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .aidorag-msg {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      
      .aidorag-msg.user {
        background: ${primaryColor};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      
      .aidorag-msg.assistant {
        background: #f3f4f6;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .aidorag-citations {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0,0,0,0.1);
        font-size: 11px;
        color: #6b7280;
      }
      
      .aidorag-typing {
        display: flex;
        gap: 4px;
        padding: 14px 16px;
      }
      
      .aidorag-typing span {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: aidorag-bounce 1.4s infinite;
      }
      
      .aidorag-typing span:nth-child(2) { animation-delay: 0.2s; }
      .aidorag-typing span:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes aidorag-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
      
      .aidorag-input-area {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      
      .aidorag-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .aidorag-input:focus {
        border-color: ${primaryColor};
      }
      
      .aidorag-send {
        padding: 10px 16px;
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: opacity 0.2s;
      }
      
      .aidorag-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .aidorag-powered {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #9ca3af;
        border-top: 1px solid #f3f4f6;
      }
      
      .aidorag-powered a {
        color: #6b7280;
        text-decoration: none;
      }
      
      .aidorag-powered a:hover {
        color: ${primaryColor};
      }
    `;
    document.head.appendChild(style);
  };
  
  // Create widget HTML
  const createWidget = () => {
    const lang = config.defaultLanguage || 'vi';
    const welcome = config.welcomeMessage?.[lang] || config.welcomeMessage?.vi || 'Xin chào!';
    const placeholder = config.placeholder?.[lang] || config.placeholder?.vi || 'Nhập tin nhắn...';
    
    const container = document.createElement('div');
    container.id = 'aidorag-widget';
    container.innerHTML = `
      <div class="aidorag-window" id="aidorag-window">
        <div class="aidorag-header">
          <div class="aidorag-avatar">
            ${config.botAvatarUrl 
              ? `<img src="${config.botAvatarUrl}" alt="">`
              : `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`
            }
          </div>
          <div class="aidorag-info">
            <h3>${config.botName || 'AI Assistant'}</h3>
            <p>Online</p>
          </div>
          <button class="aidorag-close" onclick="window.AIDORag.close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="aidorag-messages" id="aidorag-messages">
          <div class="aidorag-msg assistant">${welcome}</div>
        </div>
        
        <div class="aidorag-input-area">
          <input type="text" class="aidorag-input" id="aidorag-input" placeholder="${placeholder}" autocomplete="off">
          <button class="aidorag-send" id="aidorag-send">Gửi</button>
        </div>
        
        ${config.showPoweredBy !== false ? `
          <div class="aidorag-powered">
            Powered by <a href="https://aidorag.com" target="_blank" rel="noopener">AIDORag</a>
          </div>
        ` : ''}
      </div>
      
      <button class="aidorag-btn" id="aidorag-btn">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
        </svg>
      </button>
    `;
    document.body.appendChild(container);
    
    // Events
    document.getElementById('aidorag-btn').onclick = toggleWidget;
    document.getElementById('aidorag-send').onclick = sendMessage;
    document.getElementById('aidorag-input').onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
  };
  
  // Toggle widget
  const toggleWidget = () => {
    isOpen = !isOpen;
    const win = document.getElementById('aidorag-window');
    const btn = document.getElementById('aidorag-btn');
    
    win.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen 
      ? `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>`;
    
    if (isOpen) document.getElementById('aidorag-input').focus();
  };
  
  // Send message
  const sendMessage = async () => {
    if (isLoading) return;
    
    const input = document.getElementById('aidorag-input');
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    addMessage(message, 'user');
    
    isLoading = true;
    const typingEl = addTyping();
    
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          visitorId,
          pageUrl: window.location.href,
          pageTitle: document.title,
          language: config.defaultLanguage || 'vi'
        })
      });
      
      removeTyping(typingEl);
      
      if (res.ok) {
        const data = await res.json();
        conversationId = data.conversationId;
        addMessage(data.message.content, 'assistant', data.message.citations);
      } else {
        const err = await res.json();
        addMessage(err.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.', 'assistant');
      }
    } catch (err) {
      removeTyping(typingEl);
      addMessage('Không thể kết nối. Vui lòng thử lại.', 'assistant');
    } finally {
      isLoading = false;
    }
  };
  
  // Add message to UI
  const addMessage = (content, role, citations = []) => {
    const container = document.getElementById('aidorag-messages');
    const el = document.createElement('div');
    el.className = `aidorag-msg ${role}`;
    
    // Basic markdown
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    el.innerHTML = html;
    
    if (citations && citations.length > 0) {
      const citEl = document.createElement('div');
      citEl.className = 'aidorag-citations';
      citEl.innerHTML = citations.map(c => `📄 ${c.source || c.document_name || 'Source'}`).join('<br>');
      el.appendChild(citEl);
    }
    
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  };
  
  // Typing indicator
  const addTyping = () => {
    const container = document.getElementById('aidorag-messages');
    const el = document.createElement('div');
    el.className = 'aidorag-msg assistant';
    el.innerHTML = '<div class="aidorag-typing"><span></span><span></span><span></span></div>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  };
  
  const removeTyping = (el) => el?.remove();
  
  // Load history
  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/history?visitorId=${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) {
          conversationId = data.conversationId;
          const container = document.getElementById('aidorag-messages');
          // Clear welcome message if has history
          if (data.messages?.length > 0) {
            container.innerHTML = '';
            data.messages.forEach(m => addMessage(m.content, m.role, m.citations));
          }
        }
      }
    } catch (err) {
      // Ignore history load errors
    }
  };
  
  // Public API
  window.AIDORag = {
    open: () => !isOpen && toggleWidget(),
    close: () => isOpen && toggleWidget(),
    toggle: toggleWidget
  };
  
  // Start
  fetchConfig();
})();
```

## BƯỚC 2: VERIFY FILE

Kiểm tra file đã tạo:
- `public/widget/aidorag-widget.js`

## OUTPUT MONG ĐỢI
- [ ] Widget JavaScript file tại public/widget/
- [ ] Script có thể load config từ API
- [ ] Chat functionality hoạt động
- [ ] History persistence qua localStorage

---

# 📋 PHASE 4/5: ADMIN WIDGET MANAGEMENT UI

## MỤC TIÊU
Tạo UI cho user quản lý widgets trong Admin panel (KHÔNG PHẢI system-admin).

## LƯU Ý
- Widget management nằm trong User Admin (/admin/widgets)
- Chỉ STARTER, PRO, BUSINESS được access
- FREE plan thấy UI nhưng bị prompt upgrade

## BƯỚC 1: TẠO ADMIN API ROUTES

Tạo file: `src/app/api/admin/widgets/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Widget limits by plan
const WIDGET_LIMITS = {
  FREE: 0,
  STARTER: 1,
  PRO: 5,
  BUSINESS: -1 // unlimited
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: widgets, error } = await supabase
      .from('chatbot_widgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(widgets);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user's plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const planName = (subscription?.plan_name || 'FREE') as keyof typeof WIDGET_LIMITS;
    const widgetLimit = WIDGET_LIMITS[planName];
    
    if (widgetLimit === 0) {
      return NextResponse.json(
        { error: 'Widget feature requires STARTER plan or higher' },
        { status: 403 }
      );
    }
    
    // Check current widget count
    if (widgetLimit > 0) {
      const { count } = await supabase
        .from('chatbot_widgets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if ((count || 0) >= widgetLimit) {
        return NextResponse.json(
          { error: `Widget limit reached (${widgetLimit}). Upgrade your plan for more widgets.` },
          { status: 403 }
        );
      }
    }
    
    // Generate widget key
    const widgetKey = `wgt_${crypto.randomUUID().replace(/-/g, '').substring(0, 32)}`;
    
    // Determine branding based on plan
    const showPoweredBy = planName === 'STARTER'; // STARTER must show, PRO/BUSINESS can hide
    
    const { data: widget, error } = await supabase
      .from('chatbot_widgets')
      .insert({
        ...body,
        user_id: user.id,
        widget_key: widgetKey,
        show_powered_by: body.show_powered_by ?? showPoweredBy
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

Tạo file: `src/app/api/admin/widgets/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: widget, error } = await supabase
      .from('chatbot_widgets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }
    
    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check plan for branding restriction
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const planName = subscription?.plan_name || 'FREE';
    
    // STARTER cannot disable powered by
    if (planName === 'STARTER' && body.show_powered_by === false) {
      body.show_powered_by = true;
    }
    
    const { data: widget, error } = await supabase
      .from('chatbot_widgets')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(widget);
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { error } = await supabase
      .from('chatbot_widgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## BƯỚC 2: TẠO ADMIN UI PAGE

Tạo file: `src/app/(admin)/admin/widgets/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Copy, Settings, Trash2, Code, BarChart3, 
  MessageSquare, ExternalLink, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface Widget {
  id: string;
  name: string;
  widget_key: string;
  theme: {
    primaryColor: string;
    position: string;
  };
  bot_name: string;
  welcome_message_vi: string;
  welcome_message_en: string;
  placeholder_vi: string;
  placeholder_en: string;
  default_language: string;
  show_powered_by: boolean;
  allowed_domains: string[];
  is_active: boolean;
  total_conversations: number;
  total_messages: number;
  created_at: string;
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  
  useEffect(() => {
    fetchWidgets();
  }, []);
  
  const fetchWidgets = async () => {
    try {
      const res = await fetch('/api/admin/widgets');
      if (res.ok) {
        const data = await res.json();
        setWidgets(data);
      } else {
        const err = await res.json();
        if (err.error?.includes('STARTER')) {
          // Show upgrade prompt
        }
      }
    } catch (error) {
      toast.error('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  };
  
  const copyEmbedCode = (widget: Widget) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aidorag.com';
    const code = `<!-- AIDORag Chat Widget -->
<script 
  src="${origin}/widget/aidorag-widget.js" 
  data-widget-key="${widget.widget_key}"
  async
></script>`;
    navigator.clipboard.writeText(code);
    toast.success('Embed code copied!');
  };
  
  const deleteWidget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;
    
    try {
      const res = await fetch(`/api/admin/widgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Widget deleted');
        fetchWidgets();
      }
    } catch (error) {
      toast.error('Failed to delete widget');
    }
  };
  
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chatbot Widgets</h1>
          <p className="text-muted-foreground">
            Create embeddable chatbots for your websites
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Widget</DialogTitle>
              <DialogDescription>
                Configure your chatbot widget
              </DialogDescription>
            </DialogHeader>
            <WidgetForm 
              onSuccess={() => {
                setShowCreate(false);
                fetchWidgets();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first chatbot widget to embed on your website
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {widget.name}
                    <span className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </CardTitle>
                  <CardDescription>
                    {widget.total_conversations} conversations • {widget.total_messages} messages
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyEmbedCode(widget)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Embed Code
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedWidget(widget);
                      setShowEmbed(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteWidget(widget.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: widget.theme?.primaryColor || '#3B82F6' }}
                    />
                    {widget.theme?.primaryColor || '#3B82F6'}
                  </span>
                  <span>Bot: {widget.bot_name}</span>
                  <span>Position: {widget.theme?.position || 'bottom-right'}</span>
                  {widget.allowed_domains?.length > 0 && (
                    <span>Domains: {widget.allowed_domains.join(', ')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Widget Dialog */}
      <Dialog open={showEmbed} onOpenChange={setShowEmbed}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
          </DialogHeader>
          {selectedWidget && (
            <WidgetForm 
              widget={selectedWidget}
              onSuccess={() => {
                setShowEmbed(false);
                fetchWidgets();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WidgetForm({ widget, onSuccess }: { widget?: Widget; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: widget?.name || '',
    bot_name: widget?.bot_name || 'AI Assistant',
    welcome_message_vi: widget?.welcome_message_vi || 'Xin chào! Tôi có thể giúp gì cho bạn?',
    welcome_message_en: widget?.welcome_message_en || 'Hi! How can I help you today?',
    placeholder_vi: widget?.placeholder_vi || 'Nhập tin nhắn...',
    placeholder_en: widget?.placeholder_en || 'Type your message...',
    default_language: widget?.default_language || 'vi',
    theme: widget?.theme || { primaryColor: '#3B82F6', position: 'bottom-right' },
    allowed_domains: widget?.allowed_domains?.join('\n') || '',
    is_active: widget?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        allowed_domains: formData.allowed_domains
          .split('\n')
          .map(d => d.trim())
          .filter(Boolean)
      };
      
      const url = widget ? `/api/admin/widgets/${widget.id}` : '/api/admin/widgets';
      const method = widget ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(widget ? 'Widget updated!' : 'Widget created!');
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save widget');
      }
    } catch (error) {
      toast.error('Failed to save widget');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Widget Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My Website Chatbot"
          required
        />
      </div>
      
      <div>
        <Label>Bot Name</Label>
        <Input
          value={formData.bot_name}
          onChange={(e) => setFormData({ ...formData, bot_name: e.target.value })}
          placeholder="e.g., AIDO Assistant"
        />
      </div>
      
      <Tabs defaultValue="vi">
        <TabsList>
          <TabsTrigger value="vi">Vietnamese</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        <TabsContent value="vi" className="space-y-4">
          <div>
            <Label>Welcome Message</Label>
            <Textarea
              value={formData.welcome_message_vi}
              onChange={(e) => setFormData({ ...formData, welcome_message_vi: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label>Input Placeholder</Label>
            <Input
              value={formData.placeholder_vi}
              onChange={(e) => setFormData({ ...formData, placeholder_vi: e.target.value })}
            />
          </div>
        </TabsContent>
        <TabsContent value="en" className="space-y-4">
          <div>
            <Label>Welcome Message</Label>
            <Textarea
              value={formData.welcome_message_en}
              onChange={(e) => setFormData({ ...formData, welcome_message_en: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Label>Input Placeholder</Label>
            <Input
              value={formData.placeholder_en}
              onChange={(e) => setFormData({ ...formData, placeholder_en: e.target.value })}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.theme.primaryColor}
              onChange={(e) => setFormData({
                ...formData,
                theme: { ...formData.theme, primaryColor: e.target.value }
              })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.theme.primaryColor}
              onChange={(e) => setFormData({
                ...formData,
                theme: { ...formData.theme, primaryColor: e.target.value }
              })}
            />
          </div>
        </div>
        <div>
          <Label>Position</Label>
          <Select
            value={formData.theme.position}
            onValueChange={(value) => setFormData({
              ...formData,
              theme: { ...formData.theme, position: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label>Default Language</Label>
        <Select
          value={formData.default_language}
          onValueChange={(value) => setFormData({ ...formData, default_language: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">Vietnamese</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Allowed Domains (one per line, leave empty to allow all)</Label>
        <Textarea
          value={formData.allowed_domains}
          onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
          placeholder="example.com&#10;app.example.com"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Only these domains can embed this widget
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>Widget Active</Label>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Saving...' : widget ? 'Update Widget' : 'Create Widget'}
      </Button>
    </form>
  );
}
```

## BƯỚC 3: CẬP NHẬT USER ADMIN SIDEBAR

Tìm file sidebar của User Admin (có thể là `src/components/admin/AdminSidebar.tsx` hoặc tương tự) và thêm:

```typescript
{
  name: 'Widgets',
  href: '/admin/widgets',
  icon: MessageSquare, // from lucide-react
}
```

## OUTPUT MONG ĐỢI
- [ ] API routes cho widgets CRUD
- [ ] Admin UI tại /admin/widgets
- [ ] Widget creation form
- [ ] Embed code copy functionality
- [ ] Sidebar navigation updated

---

# 📋 PHASE 5/5: RAG INTEGRATION & TESTING

## MỤC TIÊU
Kết nối Widget với RAG system hiện có và test.

## BƯỚC 1: INTEGRATE RAG SYSTEM

Cập nhật file `src/app/api/widget/[widgetKey]/chat/route.ts`

Thay thế function `callExistingRAG` bằng actual RAG integration:

```typescript
// Import existing RAG service
// Kiểm tra xem project có file nào handle RAG query
// Có thể là: src/lib/rag/, src/services/rag/, etc.

async function callExistingRAG(params: {
  query: string;
  userId: string;
  organizationId: string | null;
  mode: string;
  history: { role: string; content: string }[];
  knowledgeBaseIds: string[];
}) {
  // Option 1: Import RAG service trực tiếp
  // import { queryRAG } from '@/lib/rag/query';
  // const result = await queryRAG({...});
  
  // Option 2: Internal API call
  // Đã có /api/v1/query endpoint, có thể reuse
  
  // Tìm và đọc file existing RAG implementation
  // Adapt để dùng trong widget context
  
  return {
    content: 'RAG response here',
    citations: []
  };
}
```

## BƯỚC 2: INCREMENT USAGE

Đảm bảo mỗi widget query đều increment user's query usage:

```typescript
// Tìm existing usage service
// Có thể là: src/services/usageService.ts

import { usageService } from '@/services/usageService';

// Trong widget chat handler, sau khi RAG query thành công:
await usageService.incrementUsage(widget.organization_id, 'queries', 1);
```

## BƯỚC 3: TEST WIDGET

1. Truy cập `/admin/widgets`
2. Tạo widget mới
3. Copy embed code
4. Test bằng cách thêm vào một HTML file local:

```html
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>Widget Test Page</h1>
  
  <!-- Paste embed code here -->
  <script 
    src="http://localhost:3000/widget/aidorag-widget.js" 
    data-widget-key="YOUR_WIDGET_KEY"
  ></script>
</body>
</html>
```

5. Mở file HTML trong browser
6. Test chat functionality

## BƯỚC 4: TEST TRÊN LANDING PAGE

Thêm widget vào landing page của AIDORag để demo:

Tìm file layout của marketing pages và thêm (optional, cho demo):

```typescript
// Chỉ show trong development
{process.env.NODE_ENV === 'development' && (
  <Script
    src="/widget/aidorag-widget.js"
    data-widget-key="demo-widget-key"
    strategy="lazyOnload"
  />
)}
```

## OUTPUT MONG ĐỢI
- [ ] Widget connected với RAG system
- [ ] Usage tracking hoạt động
- [ ] Widget hiển thị trên test page
- [ ] Chat functionality hoạt động end-to-end

---

# ✅ TỔNG KẾT

| Phase | Nội dung | Files |
|-------|----------|-------|
| 1 | Database Migration | 1 migration file |
| 2 | Widget Public API | 3 API routes |
| 3 | Widget JavaScript | 1 JS file |
| 4 | Admin UI | 2 API routes + 1 page |
| 5 | Integration & Test | Update existing files |

## WIDGET LIMITS BY PLAN

| Plan | Widgets | Queries | Branding |
|------|---------|---------|----------|
| FREE | ❌ 0 | - | - |
| STARTER | 1 | 1,000/mo | "Powered by AIDORag" |
| PRO | 5 | 5,000/mo | Custom |
| BUSINESS | ∞ | 20,000/mo | White-label |

## THỰC HIỆN

1. Copy **PHASE 1** → Claude Code → Execute
2. Verify database tables
3. Copy **PHASE 2** → Claude Code → Execute
4. Verify API endpoints
5. Copy **PHASE 3** → Claude Code → Execute
6. Verify widget JS
7. Copy **PHASE 4** → Claude Code → Execute
8. Verify Admin UI
9. Copy **PHASE 5** → Claude Code → Execute
10. Full testing
