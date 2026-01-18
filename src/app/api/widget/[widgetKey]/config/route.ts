import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface WidgetData {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  widget_key: string;
  theme: Record<string, unknown> | null;
  bot_name: string;
  bot_avatar_url: string | null;
  welcome_message_en: string;
  welcome_message_vi: string;
  placeholder_en: string;
  placeholder_vi: string;
  default_language: string;
  allowed_domains: string[];
  system_prompt: string | null;
  rag_mode: string;
  max_tokens: number;
  show_powered_by: boolean;
  auto_open_delay: number;
  is_active: boolean;
  custom_logo_url?: string | null;
}

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

    // Get widget config
    const { data: widgetData, error } = await supabaseAdmin
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();

    const widget = widgetData as WidgetData | null;

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
