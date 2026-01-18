import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface WidgetData {
  id: string;
  user_id: string;
  organization_id: string | null;
  allowed_domains: string[];
  is_active: boolean;
}

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

    // Get widget
    const { data: widgetData } = await supabaseAdmin
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();

    const widget = widgetData as WidgetData | null;

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
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

    // Get latest conversation
    const { data: conversation } = await supabaseAdmin
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
    const { data: messages } = await supabaseAdmin
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
