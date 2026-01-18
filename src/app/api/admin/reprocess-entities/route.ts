import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';
import { processEntitiesForDocument } from '@/lib/processing/entity-extractor';

/**
 * POST /api/admin/reprocess-entities
 * Re-extract entities and relations for documents
 *
 * Body: { documentId?: string } - Optional specific document ID
 * If no documentId, processes all completed documents for the user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { documentId } = body;

    console.log('[ReprocessEntities] Starting for user:', user.id, 'documentId:', documentId || 'ALL');

    // Get documents to process
    let query = supabaseAdmin
      .from('documents')
      .select('id, file_name, user_id, workspace')
      .eq('status', 'processed')
      .eq('user_id', user.id);

    if (documentId) {
      query = query.eq('id', documentId);
    }

    const { data: documents, error: docsError } = await query;

    if (docsError) {
      console.error('[ReprocessEntities] Error fetching documents:', docsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents to process',
        processed: 0,
        results: [],
      });
    }

    console.log('[ReprocessEntities] Found', documents.length, 'documents to process');

    const results = [];

    for (const doc of documents) {
      try {
        console.log('[ReprocessEntities] Processing document:', doc.id, doc.file_name);

        // Delete existing entities for this document (via source_chunk_ids)
        // First get chunks for this document
        const { data: chunks } = await supabaseAdmin
          .from('chunks')
          .select('id, content')
          .eq('document_id', doc.id);

        if (!chunks || chunks.length === 0) {
          results.push({
            documentId: doc.id,
            fileName: doc.file_name,
            success: false,
            error: 'No chunks found',
            entitiesCreated: 0,
            relationsCreated: 0,
          });
          continue;
        }

        const chunkIds = chunks.map(c => c.id);
        console.log('[ReprocessEntities] Found', chunks.length, 'chunks');

        // Delete existing entities that reference these chunks
        const { data: existingEntities } = await supabaseAdmin
          .from('entities')
          .select('id, source_chunk_ids')
          .eq('user_id', user.id);

        if (existingEntities) {
          for (const entity of existingEntities) {
            const sourceIds = entity.source_chunk_ids as string[];
            if (sourceIds?.some(id => chunkIds.includes(id))) {
              await supabaseAdmin.from('entities').delete().eq('id', entity.id);
            }
          }
        }

        // Delete existing relations that reference these chunks
        const { data: existingRelations } = await supabaseAdmin
          .from('relations')
          .select('id, source_chunk_ids')
          .eq('user_id', user.id);

        if (existingRelations) {
          for (const relation of existingRelations) {
            const sourceIds = relation.source_chunk_ids as string[];
            if (sourceIds?.some(id => chunkIds.includes(id))) {
              await supabaseAdmin.from('relations').delete().eq('id', relation.id);
            }
          }
        }

        // Run entity extraction
        const extractionResult = await processEntitiesForDocument(
          doc.id,
          chunks,
          doc.workspace || 'default',
          doc.user_id
        );

        results.push({
          documentId: doc.id,
          fileName: doc.file_name,
          success: true,
          chunksProcessed: chunks.length,
          entitiesCreated: extractionResult.entitiesCreated,
          relationsCreated: extractionResult.relationsCreated,
        });

        console.log('[ReprocessEntities] Document processed:', doc.file_name,
          'Entities:', extractionResult.entitiesCreated,
          'Relations:', extractionResult.relationsCreated);

      } catch (docError) {
        console.error('[ReprocessEntities] Error processing document:', doc.id, docError);
        results.push({
          documentId: doc.id,
          fileName: doc.file_name,
          success: false,
          error: docError instanceof Error ? docError.message : 'Unknown error',
          entitiesCreated: 0,
          relationsCreated: 0,
        });
      }
    }

    const totalEntities = results.reduce((sum, r) => sum + (r.entitiesCreated || 0), 0);
    const totalRelations = results.reduce((sum, r) => sum + (r.relationsCreated || 0), 0);

    return NextResponse.json({
      success: true,
      message: `Processed ${documents.length} documents`,
      processed: documents.length,
      totalEntities,
      totalRelations,
      results,
    });

  } catch (error) {
    console.error('[ReprocessEntities] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reprocess-entities
 * Get status of entity extraction for user's documents
 */
export async function GET(_request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document counts
    const { count: totalDocs } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'processed');

    // Get entity count
    const { count: totalEntities } = await supabaseAdmin
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get relation count
    const { count: totalRelations } = await supabaseAdmin
      .from('relations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        documentsProcessed: totalDocs || 0,
        entitiesExtracted: totalEntities || 0,
        relationsExtracted: totalRelations || 0,
      },
    });

  } catch (error) {
    console.error('[ReprocessEntities] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
