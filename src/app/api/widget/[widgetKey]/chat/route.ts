import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { safeDecrypt } from '@/lib/crypto/encryption';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding, vectorToString } from '@/lib/gemini/embeddings';
import { usageService } from '@/services/usageService';

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
  // Bot settings
  answer_length: string;
  answer_tone: string;
  auto_reply: boolean;
  unknown_answer_action: string;
  unknown_answer_text: string;
  allow_emoji: boolean;
  domain_restriction_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  status: string;
  similarity?: number;
}

interface SimilarFAQ {
  id: string;
  question: string;
  answer: string;
  status: string;
  similarity: number;
}

interface ChunkWithScore {
  id: string;
  document_id: string;
  content: string;
  chunk_type: string;
  similarity: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * Search Knowledge Base chunks using vector embeddings
 * Used as fallback when FAQ doesn't match
 */
async function searchKnowledgeBase(
  userQuestion: string,
  userId: string,
  limit: number = 5,
  similarityThreshold: number = 0.3
): Promise<ChunkWithScore[]> {
  try {
    // Generate embedding for user question
    const questionEmbedding = await generateEmbedding(userQuestion);

    // Search for similar chunks using vector similarity
    const { data: similarChunks, error } = await supabaseAdmin.rpc('search_chunks', {
      query_embedding: questionEmbedding,
      match_threshold: similarityThreshold,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      console.error('[KB Search] Vector search error:', error);
      return [];
    }

    console.log(`[KB Search] Found ${similarChunks?.length || 0} similar chunks for question: "${userQuestion.substring(0, 50)}..."`);
    return (similarChunks || []) as ChunkWithScore[];
  } catch (error) {
    console.error('[KB Search] Error generating embedding or searching:', error);
    return [];
  }
}

/**
 * Generate answer from Knowledge Base chunks using Gemini
 * NO CITATIONS - per user request to protect company information
 */
async function generateKBAnswer(
  userQuestion: string,
  chunks: ChunkWithScore[],
  geminiApiKey: string,
  systemPrompt: string | null,
  language: string
): Promise<string | null> {
  if (chunks.length === 0) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build context from chunks (NO source references)
  const context = chunks
    .map((chunk, idx) => `[Đoạn ${idx + 1}]\n${chunk.content}`)
    .join('\n\n');

  const prompt = `${systemPrompt || ''}

Bạn là trợ lý AI thông minh. Dưới đây là các thông tin từ tài liệu nội bộ:

${context}

CÂU HỎI CỦA KHÁCH HÀNG: "${userQuestion}"

NHIỆM VỤ:
1. Dựa trên các thông tin trên, trả lời câu hỏi của khách hàng một cách chính xác
2. Nếu thông tin không đủ để trả lời, trả lời: [NO_MATCH]
3. Trả lời bằng ngôn ngữ: ${language === 'vi' ? 'Tiếng Việt' : 'English'}

QUAN TRỌNG:
- KHÔNG đề cập đến nguồn tài liệu, không nói "theo tài liệu", "dựa trên thông tin"
- KHÔNG thêm citations hoặc references
- Trả lời tự nhiên như một nhân viên hỗ trợ thực sự
- Nếu không có thông tin phù hợp, chỉ trả lời: [NO_MATCH]`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Check if no match found
    if (responseText === '[NO_MATCH]' || responseText.includes('[NO_MATCH]')) {
      return null;
    }

    return responseText;
  } catch (error) {
    console.error('Gemini KB answer error:', error);
    return null;
  }
}

/**
 * Search for similar FAQs using vector embeddings
 * This is the optimized approach - only sends top N relevant FAQs to Gemini
 */
async function searchSimilarFAQs(
  userQuestion: string,
  widgetId: string,
  limit: number = 5,
  similarityThreshold: number = 0.5
): Promise<SimilarFAQ[]> {
  try {
    // Generate embedding for user question
    const questionEmbedding = await generateEmbedding(userQuestion);
    const embeddingString = vectorToString(questionEmbedding);

    // Search for similar FAQs using vector similarity
    const { data: similarFaqs, error } = await supabaseAdmin.rpc('search_similar_faqs', {
      p_query_embedding: embeddingString,
      p_widget_id: widgetId,
      p_limit: limit,
      p_similarity_threshold: similarityThreshold
    });

    if (error) {
      console.error('[FAQ Search] Vector search error:', error);
      return [];
    }

    console.log(`[FAQ Search] Found ${similarFaqs?.length || 0} similar FAQs for question: "${userQuestion.substring(0, 50)}..."`);
    return (similarFaqs || []) as SimilarFAQ[];
  } catch (error) {
    console.error('[FAQ Search] Error generating embedding or searching:', error);
    return [];
  }
}

/**
 * Find best matching FAQ using Gemini for semantic similarity
 * OPTIMIZED: Only sends top N relevant FAQs (from vector search) to Gemini
 * Falls back to all FAQs if embeddings are not available
 */
async function findMatchingFAQ(
  userQuestion: string,
  widgetId: string,
  allFaqs: FAQ[],
  geminiApiKey: string,
  systemPrompt: string | null
): Promise<{ faq: FAQ | null; answer: string | null }> {
  if (allFaqs.length === 0) {
    return { faq: null, answer: null };
  }

  // Try vector search first (optimized path)
  let faqsToSearch: FAQ[] = [];
  const similarFaqs = await searchSimilarFAQs(userQuestion, widgetId, 5, 0.4);

  if (similarFaqs.length > 0) {
    // Use only the semantically similar FAQs (saves tokens!)
    faqsToSearch = similarFaqs;
    console.log(`[FAQ Search] Using ${faqsToSearch.length} similar FAQs (vector search)`);
  } else {
    // Fallback: Check if any FAQs have embeddings
    const { data: embeddingStatus } = await supabaseAdmin.rpc('get_faq_embedding_status', {
      p_widget_id: widgetId
    });

    if (embeddingStatus?.[0]?.without_embedding === allFaqs.length) {
      // No embeddings yet - use all FAQs (legacy behavior, but limited)
      console.log('[FAQ Search] No embeddings found, using top 10 FAQs');
      faqsToSearch = allFaqs.slice(0, 10); // Limit to 10 to avoid huge token usage
    } else {
      // Embeddings exist but no match above threshold
      console.log('[FAQ Search] No similar FAQs found above threshold');
      return { faq: null, answer: null };
    }
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build FAQ context (now with only relevant FAQs)
  const faqContext = faqsToSearch
    .map((faq, idx) => {
      const similarityInfo = faq.similarity ? ` (similarity: ${(faq.similarity * 100).toFixed(1)}%)` : '';
      return `FAQ #${idx + 1}${similarityInfo}:\nQ: ${faq.question}\nA: ${faq.answer}`;
    })
    .join('\n\n');

  const prompt = `${systemPrompt || ''}

Bạn là trợ lý AI thông minh. Dưới đây là các câu hỏi thường gặp (FAQ) có liên quan đến câu hỏi của khách hàng:

${faqContext}

CÂU HỎI CỦA KHÁCH HÀNG: "${userQuestion}"

NHIỆM VỤ:
1. Tìm FAQ phù hợp nhất với câu hỏi của khách hàng (có thể không chính xác từ ngữ, nhưng ý nghĩa tương tự)
2. Nếu tìm thấy FAQ phù hợp, trả lời dựa trên câu trả lời trong FAQ đó
3. Bạn có thể điều chỉnh câu trả lời cho phù hợp với câu hỏi cụ thể, nhưng phải giữ đúng thông tin từ FAQ
4. Nếu KHÔNG có FAQ nào phù hợp, trả lời: [NO_MATCH]

ĐỊNH DẠNG OUTPUT:
- Nếu có FAQ phù hợp: Trả lời trực tiếp, tự nhiên, KHÔNG đề cập đến FAQ
- Nếu không có FAQ phù hợp: Chỉ trả lời đúng 1 từ: [NO_MATCH]

QUAN TRỌNG:
- KHÔNG bao giờ đề cập rằng bạn đang dùng FAQ
- KHÔNG nói "Theo FAQ..." hay "Dựa trên câu hỏi thường gặp..."
- Trả lời như một nhân viên hỗ trợ thực sự`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Check if no match found
    if (responseText === '[NO_MATCH]' || responseText.includes('[NO_MATCH]')) {
      return { faq: null, answer: null };
    }

    // Return the AI-enhanced answer based on FAQ
    return { faq: faqsToSearch[0], answer: responseText };
  } catch (error) {
    console.error('Gemini FAQ matching error:', error);
    return { faq: null, answer: null };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;

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
    const { data: widgetData, error: widgetError } = await supabaseAdmin
      .rpc('get_widget_by_key', { p_widget_key: widgetKey })
      .single();

    const widget = widgetData as WidgetData | null;

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check domain restriction if enabled
    const origin = request.headers.get('origin') || '';
    if (widget.domain_restriction_enabled && widget.allowed_domains && widget.allowed_domains.length > 0 && origin) {
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

    // Check usage quota của widget owner
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', widget.user_id)
      .eq('status', 'active')
      .single();

    const planName = (subscription?.plan_name || 'FREE').toUpperCase();

    // FREE plan không được dùng widget
    if (planName === 'FREE') {
      return NextResponse.json(
        { error: 'Widget requires STARTER or higher plan' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get Gemini API key
    let geminiApiKey: string | null = null;
    if (widget.organization_id) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('gemini_api_key_encrypted')
        .eq('id', widget.organization_id)
        .single();

      if (org?.gemini_api_key_encrypted) {
        geminiApiKey = safeDecrypt(org.gemini_api_key_encrypted);
      }
    }

    // Fallback to default API key if no org key
    if (!geminiApiKey) {
      geminiApiKey = process.env.GOOGLE_AI_API_KEY || null;
    }

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'No API key configured for this widget' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabaseAdmin
        .from('widget_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('widget_id', widget.id)
        .single();
      conversation = data;
    }

    const isNewConversation = !conversation;

    if (!conversation) {
      const { data: newConv, error: convError } = await supabaseAdmin
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
    await supabaseAdmin.from('widget_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message
    });

    // ==================================================
    // FAQ-FIRST + KNOWLEDGE BASE FALLBACK APPROACH
    // 1. Try FAQs first (fast, curated answers)
    // 2. If no FAQ match, search Knowledge Base (documents)
    // 3. If still no match, return unknown_answer_text
    // ==================================================

    // Get active FAQs for this widget
    const { data: faqs } = await supabaseAdmin
      .from('widget_faqs')
      .select('id, question, answer, status')
      .eq('widget_id', widget.id)
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    let responseContent: string = '';
    let isUnanswered = false;
    let ragMode: 'faq' | 'kb' | 'none' = 'none';

    // Step 1: Try FAQ first
    if (faqs && faqs.length > 0) {
      console.log(`[Widget Chat] Trying FAQ match for: "${message.substring(0, 50)}..."`);
      const { answer } = await findMatchingFAQ(
        message,
        widget.id,
        faqs as FAQ[],
        geminiApiKey,
        widget.system_prompt
      );

      if (answer) {
        responseContent = answer;
        ragMode = 'faq';
        console.log('[Widget Chat] FAQ matched successfully');
      }
    }

    // Step 2: If FAQ didn't match, try Knowledge Base fallback
    if (ragMode === 'none') {
      console.log(`[Widget Chat] FAQ not matched, trying Knowledge Base for user: ${widget.user_id}`);

      // Search Knowledge Base chunks owned by widget owner
      const kbChunks = await searchKnowledgeBase(message, widget.user_id, 5, 0.3);

      if (kbChunks.length > 0) {
        console.log(`[Widget Chat] Found ${kbChunks.length} KB chunks, generating answer...`);
        const kbAnswer = await generateKBAnswer(
          message,
          kbChunks,
          geminiApiKey,
          widget.system_prompt,
          language
        );

        if (kbAnswer) {
          responseContent = kbAnswer;
          ragMode = 'kb';
          console.log('[Widget Chat] KB answer generated successfully');
        }
      }
    }

    // Step 3: If neither FAQ nor KB matched, mark as unanswered
    if (ragMode === 'none') {
      isUnanswered = true;
      responseContent = widget.unknown_answer_text ||
        (language === 'vi'
          ? 'Xin lỗi, tôi chưa có thông tin về vấn đề này. Câu hỏi của bạn đã được ghi nhận để chúng tôi cập nhật.'
          : 'Sorry, I don\'t have information about this yet. Your question has been recorded for our team to review.');
      console.log('[Widget Chat] No match found, using default response');
    }

    // Save unanswered question for review
    if (isUnanswered) {
      try {
        await supabaseAdmin.rpc('record_unanswered_question', {
          p_widget_id: widget.id,
          p_question: message,
          p_conversation_id: conversation.id,
          p_visitor_id: visitorId,
          p_user_context: pageUrl || null
        });
      } catch (unansweredError) {
        // Log but don't fail - unanswered table might not exist yet
        console.error('Failed to record unanswered question:', unansweredError);
      }
    }

    // Save assistant message
    const { data: assistantMsg } = await supabaseAdmin
      .from('widget_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: responseContent,
        citations: [], // NO citations for widget chatbot (protect company info)
        rag_mode: ragMode
      })
      .select()
      .single();

    // Update widget stats
    await supabaseAdmin.rpc('increment_widget_stats', {
      p_widget_id: widget.id,
      p_is_new_conversation: isNewConversation
    });

    // ================================================
    // INCREMENT QUERY USAGE FOR WIDGET OWNER
    // 1 query = 1 user question (regardless of API calls)
    // This counts against the widget owner's plan limit
    // ================================================
    try {
      await usageService.incrementUsage(widget.user_id, 'queries', 1);
      console.log(`[Widget Chat] Incremented query usage for user: ${widget.user_id}`);
    } catch (usageError) {
      // Don't fail the chat if usage tracking fails
      console.error('[Widget Chat] Failed to increment query usage:', usageError);
    }

    // Update conversation timestamp
    await supabaseAdmin
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
        content: responseContent,
        citations: [] // NO citations for widget chatbot
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
