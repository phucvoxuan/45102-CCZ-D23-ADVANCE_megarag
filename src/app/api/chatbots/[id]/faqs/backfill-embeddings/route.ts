import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateEmbedding, vectorToString } from '@/lib/gemini/embeddings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chatbots/[id]/faqs/backfill-embeddings
 * Generate embeddings for all FAQs that don't have them
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

    // Get FAQs without embeddings
    const { data: faqs, error } = await supabaseAdmin
      .from('widget_faqs')
      .select('id, question')
      .eq('widget_id', id)
      .eq('status', 'active')
      .is('question_embedding', null);

    if (error) {
      console.error('Error fetching FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    if (!faqs || faqs.length === 0) {
      return NextResponse.json({
        message: 'All FAQs already have embeddings',
        processed: 0,
        total: 0
      });
    }

    console.log(`[Backfill] Starting embedding generation for ${faqs.length} FAQs`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process FAQs one by one to avoid rate limits
    for (const faq of faqs) {
      try {
        const embedding = await generateEmbedding(faq.question);
        const embeddingString = vectorToString(embedding);

        await supabaseAdmin.rpc('update_faq_embedding', {
          p_faq_id: faq.id,
          p_embedding: embeddingString
        });

        successCount++;
        console.log(`[Backfill] Generated embedding for FAQ ${faq.id} (${successCount}/${faqs.length})`);
      } catch (err) {
        errorCount++;
        const errorMsg = `FAQ ${faq.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[Backfill] Failed to generate embedding for FAQ ${faq.id}:`, err);
      }
    }

    console.log(`[Backfill] Completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      message: `Backfill completed: ${successCount} FAQs processed`,
      processed: successCount,
      errors: errorCount,
      total: faqs.length,
      errorDetails: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Backfill embeddings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/chatbots/[id]/faqs/backfill-embeddings
 * Get embedding status for this chatbot's FAQs
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

    // Get embedding status
    const { data: status, error } = await supabaseAdmin.rpc('get_faq_embedding_status', {
      p_widget_id: id
    });

    if (error) {
      console.error('Error getting embedding status:', error);
      return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }

    const stats = status?.[0] || { total_faqs: 0, with_embedding: 0, without_embedding: 0 };

    return NextResponse.json({
      total: stats.total_faqs,
      withEmbedding: stats.with_embedding,
      withoutEmbedding: stats.without_embedding,
      coverage: stats.total_faqs > 0
        ? Math.round((stats.with_embedding / stats.total_faqs) * 100)
        : 100
    });
  } catch (error) {
    console.error('Get embedding status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
