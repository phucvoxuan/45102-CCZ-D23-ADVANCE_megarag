import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/rag';
import { createClient } from '@/lib/supabase/auth-server';
import { checkQueryLimit } from '@/lib/usageMiddleware';
import { usageService } from '@/services/usageService';
import { isQueryModeAvailable } from '@/lib/features';
import type { QueryMode, QueryRequest } from '@/types';
import type { ChatSettings } from '@/lib/rag';

const VALID_MODES: QueryMode[] = ['naive', 'local', 'global', 'hybrid', 'mix'];

interface ExtendedQueryRequest extends QueryRequest {
  system_prompt?: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check query limit before processing
    const limitCheck = await checkQueryLimit(user.id);
    if (!limitCheck.ok) {
      return limitCheck.response;
    }

    const body = await request.json() as ExtendedQueryRequest;

    // Validate query
    if (!body.query || typeof body.query !== 'string' || body.query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate mode and check plan access
    let mode: QueryMode = body.mode && VALID_MODES.includes(body.mode)
      ? body.mode
      : 'naive'; // Default to naive which is available on all plans

    // Get user's plan and check mode availability
    const planName = await usageService.getPlanName(user.id);
    if (!isQueryModeAvailable(planName, mode)) {
      // Fallback to naive mode if requested mode not available
      mode = 'naive';
    }

    // Validate top_k
    const topK = body.top_k && typeof body.top_k === 'number' && body.top_k > 0 && body.top_k <= 50
      ? body.top_k
      : 10;

    // Get workspace (default if not provided)
    const workspace = body.workspace || 'default';

    // Build chat settings
    const settings: ChatSettings = {
      systemPrompt: body.system_prompt || null,
      model: body.model || null,
    };

    // Generate response (pass user.id for data isolation)
    const response = await generateResponse(
      body.query.trim(),
      user.id, // CRITICAL: Filter RAG results by user for data isolation
      mode,
      workspace,
      topK,
      settings
    );

    // Increment query usage after successful response
    try {
      await usageService.incrementUsage(user.id, 'queries', 1);
    } catch (usageError) {
      console.error('Failed to increment query usage:', usageError);
      // Don't fail the query if usage tracking fails
    }

    // Track token usage in database for cost analysis
    if (response.tokenUsage) {
      console.log('[Query API] Token usage:', {
        user_id: user.id,
        prompt_tokens: response.tokenUsage.promptTokenCount,
        completion_tokens: response.tokenUsage.candidatesTokenCount,
        total_tokens: response.tokenUsage.totalTokenCount,
        model: body.model || 'gemini-2.5-flash',
      });

      // Save token usage to database
      try {
        await usageService.incrementTokenUsage(
          user.id,
          response.tokenUsage.promptTokenCount,
          response.tokenUsage.candidatesTokenCount
        );
      } catch (tokenError) {
        console.error('[Query API] Failed to track token usage:', tokenError);
        // Don't fail the query if token tracking fails
      }
    }

    return NextResponse.json({
      response: response.response,
      sources: response.sources,
      entities: response.entities,
      mode_used: mode, // Include actual mode used (may differ from requested)
      token_usage: response.tokenUsage ? {
        prompt_tokens: response.tokenUsage.promptTokenCount,
        completion_tokens: response.tokenUsage.candidatesTokenCount,
        total_tokens: response.tokenUsage.totalTokenCount,
      } : null,
    });
  } catch (error) {
    console.error('Query error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RAG Query API',
    usage: {
      method: 'POST',
      body: {
        query: 'Your question (required)',
        mode: 'Query mode: naive | local | global | hybrid | mix (default: mix)',
        workspace: 'Workspace name (default: default)',
        top_k: 'Number of results to retrieve (default: 10, max: 50)',
      },
    },
    modes: {
      naive: 'Vector search on document chunks only',
      local: 'Search entities, get related chunks',
      global: 'Search relations, traverse knowledge graph',
      hybrid: 'Combine local and global modes',
      mix: 'Full hybrid: chunks + entities + relations (recommended)',
    },
  });
}
