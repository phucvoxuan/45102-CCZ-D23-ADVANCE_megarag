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
    const [tokenUsage, messageCount] = await Promise.all([
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
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[Stats API] Completed in ${elapsed}ms for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        documents: docStats,
        chunks: chunksResult.count || 0,
        entities: entitiesResult.count || 0,
        relations: relationsResult.count || 0,
        chat_sessions: sessionsCount,
        api_keys: apiKeysResult.count || 0,
        usage: {
          total_api_requests: apiRequestsResult,
          total_chat_queries: messageCount,
          total_llm_input_tokens: tokenUsage.input,
          total_llm_output_tokens: tokenUsage.output,
          total_embedding_requests: chunksResult.count || 0,
          total_storage_bytes: totalStorageBytes,
        },
        recent_documents: recentDocsResult.data || [],
        entity_types: Object.entries(entityTypeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
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
