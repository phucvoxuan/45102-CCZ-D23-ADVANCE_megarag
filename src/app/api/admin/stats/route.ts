import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';
import { usageService } from '@/services/usageService';

// Route segment config
export const dynamic = 'force-dynamic';

// Default empty stats for when DB is not available
const EMPTY_STATS = {
  documents: { total: 0, completed: 0, processing: 0, pending: 0, failed: 0 },
  chunks: 0,
  entities: 0,
  relations: 0,
  chat_sessions: 0,
  api_keys: 0,
  usage: {
    total_api_requests: 0,
    total_llm_input_tokens: 0,
    total_llm_output_tokens: 0,
    total_embedding_requests: 0,
    total_storage_bytes: 0,
  },
  recent_documents: [],
  entity_types: [],
};

/**
 * GET /api/admin/stats - Get dashboard statistics for current user
 * OPTIMIZED: Uses Promise.all for parallel queries instead of sequential
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get current authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ========================================
    // PHASE 1: Run all independent queries in parallel
    // ========================================
    const [
      documentsResult,
      chunksResult,
      entitiesResult,
      relationsResult,
      sessionsResult,
      apiKeysResult,
      recentDocsResult,
      entityTypesResult,
      apiRequestsResult,
      // Chatbot widget stats
      widgetStatsResult,
    ] = await Promise.all([
      // Documents with status and file_size
      supabaseAdmin
        .from('documents')
        .select('status, file_size')
        .eq('user_id', userId),

      // Chunks count
      supabaseAdmin
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Entities count
      supabaseAdmin
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Relations count
      supabaseAdmin
        .from('relations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Chat sessions (need data for message count later)
      supabaseAdmin
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId),

      // API keys count (may not exist)
      (async () => {
        try {
          const r = await supabaseAdmin
            .from('user_api_keys')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return { count: r.count || 0, error: r.error };
        } catch {
          return { count: 0, error: null };
        }
      })(),

      // Recent documents (last 5)
      supabaseAdmin
        .from('documents')
        .select('id, file_name, file_type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Entity types for distribution
      supabaseAdmin
        .from('entities')
        .select('entity_type')
        .eq('user_id', userId),

      // API requests count (may not exist)
      (async () => {
        try {
          const r = await supabaseAdmin
            .from('api_request_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          return r.count || 0;
        } catch {
          return 0;
        }
      })(),

      // Chatbot widget stats (conversations, messages, FAQs with embeddings)
      (async () => {
        try {
          // Get all widgets for this user
          const { data: widgets } = await supabaseAdmin
            .from('chatbot_widgets')
            .select('id, total_messages, total_conversations')
            .eq('user_id', userId);

          if (!widgets || widgets.length === 0) {
            return { conversations: 0, messages: 0, faqsWithEmbeddings: 0 };
          }

          const widgetIds = widgets.map(w => w.id);

          // Total conversations and messages from widgets
          const totalConversations = widgets.reduce((sum, w) => sum + (w.total_conversations || 0), 0);
          const totalMessages = widgets.reduce((sum, w) => sum + (w.total_messages || 0), 0);

          // Count FAQs with embeddings (these are like "chunks" for vector search)
          const { count: faqsWithEmbeddings } = await supabaseAdmin
            .from('widget_faqs')
            .select('*', { count: 'exact', head: true })
            .in('widget_id', widgetIds)
            .not('question_embedding', 'is', null);

          return {
            conversations: totalConversations,
            messages: totalMessages,
            faqsWithEmbeddings: faqsWithEmbeddings || 0,
          };
        } catch (err) {
          console.error('[Stats API] Error fetching widget stats:', err);
          return { conversations: 0, messages: 0, faqsWithEmbeddings: 0 };
        }
      })(),
    ]);

    // Check if tables exist
    if (documentsResult.error?.message?.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: EMPTY_STATS,
        warning: 'Database tables not initialized. Please run migrations.',
      });
    }

    // Process documents stats
    const documents = documentsResult.data || [];
    const docStats = {
      total: documents.length,
      completed: documents.filter((d: { status: string }) => d.status === 'completed' || d.status === 'processed').length,
      processing: documents.filter((d: { status: string }) => d.status === 'processing').length,
      pending: documents.filter((d: { status: string }) => d.status === 'pending').length,
      failed: documents.filter((d: { status: string }) => d.status === 'failed').length,
    };

    // Calculate storage from documents
    const totalStorageBytes = documents.reduce((sum: number, d: { file_size?: number }) => sum + (d.file_size || 0), 0);

    // Process entity types
    const entityTypeCounts: Record<string, number> = {};
    (entityTypesResult.data || []).forEach((e: { entity_type: string }) => {
      entityTypeCounts[e.entity_type] = (entityTypeCounts[e.entity_type] || 0) + 1;
    });

    // Sessions count and IDs
    const sessions = sessionsResult.data || [];
    const sessionsCount = sessions.length;
    const sessionIds = sessions.map((s: { id: string }) => s.id);

    // ========================================
    // PHASE 2: Get dependent data in parallel
    // ========================================
    const [tokenUsage, messageCount, usageRecord] = await Promise.all([
      // Token usage
      usageService.getTokenUsage(userId).catch(() => ({ input: 0, output: 0, total: 0 })),

      // Chat messages count (depends on session IDs)
      (async () => {
        if (sessionIds.length === 0) return 0;
        const { count } = await supabaseAdmin
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);
        return count || 0;
      })(),

      // Get usage record for billing queries count
      usageService.getOrCreateUsageRecord(userId).catch(() => ({
        documentsCount: 0,
        pagesCount: 0,
        queriesCount: 0,
        storageBytes: 0,
        periodStart: new Date(),
        periodEnd: new Date(),
      })),
    ]);

    // Include widget stats in totals
    const totalChunks = (chunksResult.count || 0) + widgetStatsResult.faqsWithEmbeddings;
    const totalChatSessions = sessionsCount + widgetStatsResult.conversations;
    const totalChatMessages = messageCount + widgetStatsResult.messages;
    // Billing queries count from usage_records (this is what counts against plan limits)
    const billingQueriesCount = usageRecord.queriesCount;

    const elapsed = Date.now() - startTime;
    console.log(`[Stats API] Completed in ${elapsed}ms for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        documents: docStats,
        chunks: totalChunks,
        entities: entitiesResult.count || 0,
        relations: relationsResult.count || 0,
        chat_sessions: totalChatSessions,
        api_keys: apiKeysResult.count || 0,
        usage: {
          total_api_requests: apiRequestsResult,
          total_chat_messages: totalChatMessages,
          // Billing queries - this is what counts against plan limits
          // 1 query = 1 user question (from dashboard chat OR widget chatbot)
          billing_queries: billingQueriesCount,
          total_llm_input_tokens: tokenUsage.input,
          total_llm_output_tokens: tokenUsage.output,
          total_embedding_requests: totalChunks,
          total_storage_bytes: totalStorageBytes,
        },
        recent_documents: recentDocsResult.data || [],
        entity_types: Object.entries(entityTypeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        // Widget-specific breakdown (optional, for transparency)
        widget_stats: {
          conversations: widgetStatsResult.conversations,
          messages: widgetStatsResult.messages,
          faq_embeddings: widgetStatsResult.faqsWithEmbeddings,
        },
      },
    });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
