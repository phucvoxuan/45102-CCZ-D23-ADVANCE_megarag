import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding, vectorToString } from '@/lib/gemini/embeddings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chatbots/[id]/faqs/generate - Auto-generate FAQs from Knowledge Base documents
 *
 * Body: { documentIds: string[], count?: number }
 *
 * This endpoint:
 * 1. Fetches document chunks from the selected documents
 * 2. Uses Gemini to generate Q&A pairs from the content
 * 3. Saves the generated FAQs to widget_faqs table
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

    // Verify chatbot ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id, knowledge_base_ids')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const body = await request.json();
    const { documentIds, count = 10 } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'documentIds array is required' }, { status: 400 });
    }

    // Get Gemini API key
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .single();

    const geminiApiKey = settings?.gemini_api_key || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'Gemini API key not configured. Please set it in Settings or contact administrator.'
      }, { status: 400 });
    }

    // Fetch chunks from selected documents
    const { data: chunks, error: chunksError } = await supabaseAdmin
      .from('document_chunks')
      .select('content, document_id')
      .in('document_id', documentIds)
      .order('chunk_order_index', { ascending: true })
      .limit(50); // Limit to prevent too much content

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
      return NextResponse.json({ error: 'Failed to fetch document content' }, { status: 500 });
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No content found in selected documents' }, { status: 400 });
    }

    // Combine chunk content
    const combinedContent = chunks
      .map(chunk => chunk.content)
      .join('\n\n')
      .substring(0, 30000); // Limit content size for API

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generate FAQs using Gemini
    const prompt = `Dựa trên nội dung tài liệu sau, hãy tạo ${count} cặp câu hỏi-câu trả lời FAQ (Frequently Asked Questions) phổ biến mà khách hàng có thể hỏi.

YÊU CẦU:
1. Câu hỏi phải tự nhiên, như cách khách hàng thực sự hỏi
2. Câu trả lời phải ngắn gọn, chính xác, dễ hiểu
3. Tập trung vào thông tin quan trọng và hữu ích nhất
4. Mỗi câu hỏi-trả lời phải độc lập, không trùng lặp
5. Sử dụng ngôn ngữ phù hợp với khách hàng

ĐỊNH DẠNG OUTPUT (JSON array):
[
  {
    "question": "Câu hỏi 1?",
    "answer": "Câu trả lời 1."
  },
  {
    "question": "Câu hỏi 2?",
    "answer": "Câu trả lời 2."
  }
]

NỘI DUNG TÀI LIỆU:
${combinedContent}

Chỉ trả về JSON array, không có text giải thích thêm.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let generatedFaqs: { question: string; answer: string }[];
    try {
      // Clean up response (remove markdown code blocks if present)
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      generatedFaqs = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      return NextResponse.json({
        error: 'Failed to parse generated FAQs. Please try again.'
      }, { status: 500 });
    }

    if (!Array.isArray(generatedFaqs) || generatedFaqs.length === 0) {
      return NextResponse.json({ error: 'No FAQs generated' }, { status: 500 });
    }

    // Get current max sort_order
    const { data: maxOrder } = await supabaseAdmin
      .from('widget_faqs')
      .select('sort_order')
      .eq('widget_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrder?.sort_order || 0) + 1;

    // Insert generated FAQs
    const faqsToInsert = generatedFaqs.map((faq, index) => ({
      widget_id: id,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      status: 'active',
      sort_order: nextOrder + index,
      source: 'ai_generated',
    }));

    const { data: insertedFaqs, error: insertError } = await supabaseAdmin
      .from('widget_faqs')
      .insert(faqsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting FAQs:', insertError);
      return NextResponse.json({ error: 'Failed to save generated FAQs' }, { status: 500 });
    }

    // Generate embeddings for all inserted FAQs (async, non-blocking)
    if (insertedFaqs && insertedFaqs.length > 0) {
      // Fire and forget - don't wait for embeddings
      (async () => {
        console.log(`[FAQ Embeddings] Generating embeddings for ${insertedFaqs.length} FAQs...`);
        for (const faq of insertedFaqs) {
          try {
            const embedding = await generateEmbedding(faq.question);
            const embeddingString = vectorToString(embedding);
            await supabaseAdmin.rpc('update_faq_embedding', {
              p_faq_id: faq.id,
              p_embedding: embeddingString
            });
          } catch (err) {
            console.error(`[FAQ Embeddings] Failed to generate embedding for FAQ ${faq.id}:`, err);
          }
        }
        console.log(`[FAQ Embeddings] Completed embedding generation for ${insertedFaqs.length} FAQs`);
      })().catch(console.error);
    }

    return NextResponse.json({
      faqs: insertedFaqs,
      count: insertedFaqs?.length || 0,
      message: `Successfully generated ${insertedFaqs?.length || 0} FAQs from ${documentIds.length} documents`
    });
  } catch (error) {
    console.error('Generate FAQs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
