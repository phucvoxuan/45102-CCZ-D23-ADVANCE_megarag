import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chatbots/[id]/unanswered - Get unanswered questions for a chatbot
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get unanswered questions
    let query = supabaseAdmin
      .from('unanswered_questions')
      .select('*', { count: 'exact' })
      .eq('widget_id', id)
      .order('occurrence_count', { ascending: false })
      .order('last_asked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: questions, error, count } = await query;

    if (error) {
      console.error('Error fetching unanswered questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({
      questions,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unanswered questions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/chatbots/[id]/unanswered - Convert question to FAQ
 *
 * Body: { questionId: string, answer: string }
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
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json({
        error: 'questionId and answer are required'
      }, { status: 400 });
    }

    // Verify question belongs to this chatbot
    const { data: question } = await supabaseAdmin
      .from('unanswered_questions')
      .select('*')
      .eq('id', questionId)
      .eq('widget_id', id)
      .single();

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get max sort order for FAQs
    const { data: maxOrder } = await supabaseAdmin
      .from('widget_faqs')
      .select('sort_order')
      .eq('widget_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order || 0) + 1;

    // Create FAQ
    const { data: faq, error: faqError } = await supabaseAdmin
      .from('widget_faqs')
      .insert({
        widget_id: id,
        question: question.question.trim(),
        answer: answer.trim(),
        status: 'active',
        sort_order: nextOrder,
        source: 'from_unanswered',
      })
      .select()
      .single();

    if (faqError) {
      console.error('Error creating FAQ:', faqError);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    // Update question status
    await supabaseAdmin
      .from('unanswered_questions')
      .update({
        status: 'converted_to_faq',
        converted_faq_id: faq.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    return NextResponse.json({
      faq,
      message: 'Question converted to FAQ successfully'
    });
  } catch (error) {
    console.error('Convert to FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chatbots/[id]/unanswered - Dismiss question(s)
 *
 * Body: { questionIds: string[] }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { questionIds } = body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json({
        error: 'questionIds array is required'
      }, { status: 400 });
    }

    // Update status to dismissed
    const { error } = await supabaseAdmin
      .from('unanswered_questions')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
      })
      .in('id', questionIds)
      .eq('widget_id', id);

    if (error) {
      console.error('Error dismissing questions:', error);
      return NextResponse.json({ error: 'Failed to dismiss questions' }, { status: 500 });
    }

    return NextResponse.json({
      dismissed: questionIds.length,
      message: 'Questions dismissed successfully'
    });
  } catch (error) {
    console.error('Dismiss questions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
