import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateEmbedding, vectorToString } from '@/lib/gemini/embeddings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Generate embedding for FAQ question and update in database
 */
async function updateFaqEmbedding(faqId: string, question: string): Promise<void> {
  try {
    const embedding = await generateEmbedding(question);
    const embeddingString = vectorToString(embedding);

    await supabaseAdmin.rpc('update_faq_embedding', {
      p_faq_id: faqId,
      p_embedding: embeddingString
    });

    console.log(`[FAQ Embedding] Updated embedding for FAQ ${faqId}`);
  } catch (error) {
    // Log but don't fail the main operation
    console.error(`[FAQ Embedding] Failed to generate embedding for FAQ ${faqId}:`, error);
  }
}

/**
 * GET /api/chatbots/[id]/faqs - Get all FAQs for a chatbot
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Get FAQs
    const { data: faqs, error } = await supabaseAdmin
      .from('widget_faqs')
      .select('*')
      .eq('widget_id', id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('FAQs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/chatbots/[id]/faqs - Create a new FAQ
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const body = await request.json();
    const { question, answer, status = 'active' } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Get max sort_order
    const { data: maxOrder } = await supabaseAdmin
      .from('widget_faqs')
      .select('sort_order')
      .eq('widget_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order || 0) + 1;

    // Create FAQ
    const { data: faq, error } = await supabaseAdmin
      .from('widget_faqs')
      .insert({
        widget_id: id,
        question: question.trim(),
        answer: answer.trim(),
        status,
        sort_order: nextOrder,
        source: 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    // Generate embedding for the new FAQ (async, non-blocking)
    if (faq) {
      updateFaqEmbedding(faq.id, faq.question).catch(console.error);
    }

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/chatbots/[id]/faqs - Bulk update FAQs (for reordering)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const body = await request.json();
    const { faqs } = body;

    if (!Array.isArray(faqs)) {
      return NextResponse.json({ error: 'FAQs array is required' }, { status: 400 });
    }

    // Update each FAQ's sort_order
    for (let i = 0; i < faqs.length; i++) {
      await supabaseAdmin
        .from('widget_faqs')
        .update({ sort_order: i, updated_at: new Date().toISOString() })
        .eq('id', faqs[i].id)
        .eq('widget_id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk update FAQs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
