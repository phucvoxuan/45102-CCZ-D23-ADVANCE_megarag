import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateEmbedding, vectorToString } from '@/lib/gemini/embeddings';

interface RouteParams {
  params: Promise<{ id: string; faqId: string }>;
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
 * GET /api/chatbots/[id]/faqs/[faqId] - Get a specific FAQ
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, faqId } = await params;
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

    const { data: faq, error } = await supabaseAdmin
      .from('widget_faqs')
      .select('*')
      .eq('id', faqId)
      .eq('widget_id', id)
      .single();

    if (error || !faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('Get FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/chatbots/[id]/faqs/[faqId] - Update a FAQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, faqId } = await params;
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
    const allowedFields = ['question', 'answer', 'status', 'sort_order'];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: faq, error } = await supabaseAdmin
      .from('widget_faqs')
      .update(updateData)
      .eq('id', faqId)
      .eq('widget_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
    }

    // If question was updated, regenerate embedding
    if (faq && 'question' in body) {
      updateFaqEmbedding(faq.id, faq.question).catch(console.error);
    }

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('Update FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chatbots/[id]/faqs/[faqId] - Delete a FAQ
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, faqId } = await params;
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

    const { error } = await supabaseAdmin
      .from('widget_faqs')
      .delete()
      .eq('id', faqId)
      .eq('widget_id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
