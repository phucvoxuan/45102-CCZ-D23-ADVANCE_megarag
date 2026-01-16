import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { usageService } from '@/services/usageService';
import type { Document } from '@/types';

// GET: List documents for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[Documents API] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const workspace = searchParams.get('workspace');

    const offset = (page - 1) * limit;

    // Build query - ALWAYS filter by user_id for data isolation
    let query = supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id) // CRITICAL: Filter by authenticated user
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by workspace only if explicitly provided
    if (workspace) {
      query = query.eq('workspace', workspace);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    console.log('[Documents API] Query params:', { page, limit, status, workspace, userId: user.id });

    const { data, error, count } = await query;
    console.log('[Documents API] Result:', { count, error, dataLength: data?.length, userId: user.id });

    if (error) {
      // Check if table doesn't exist or schema cache issue
      if (error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return NextResponse.json({
          documents: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
          warning: 'Database tables not initialized. Please run migrations.',
        });
      }
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: data as Document[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update a document (rename, update metadata)
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, file_name, description, tags, category, customMetadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Check if any update field is provided
    const hasFileName = file_name && typeof file_name === 'string' && file_name.trim();
    const hasMetadataUpdate = description !== undefined || tags !== undefined ||
                              category !== undefined || customMetadata !== undefined;

    if (!hasFileName && !hasMetadataUpdate) {
      return NextResponse.json(
        { error: 'At least one field to update is required (file_name, description, tags, category, or customMetadata)' },
        { status: 400 }
      );
    }

    // Get current document - verify ownership
    const { data: currentDoc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('metadata, user_id')
      .eq('id', id)
      .eq('user_id', user.id) // CRITICAL: Verify ownership
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (hasFileName) {
      updateData.file_name = file_name.trim();
    }

    // Merge metadata updates
    if (hasMetadataUpdate) {
      const existingMetadata = (currentDoc?.metadata as Record<string, unknown>) || {};
      const updatedMetadata = { ...existingMetadata };

      if (description !== undefined) {
        if (description === null || description === '') {
          delete updatedMetadata.description;
        } else {
          updatedMetadata.description = description;
        }
      }

      if (tags !== undefined) {
        if (tags === null || (Array.isArray(tags) && tags.length === 0)) {
          delete updatedMetadata.tags;
        } else {
          updatedMetadata.tags = Array.isArray(tags) ? tags : [tags];
        }
      }

      if (category !== undefined) {
        if (category === null || category === '') {
          delete updatedMetadata.category;
        } else {
          updatedMetadata.category = category;
        }
      }

      if (customMetadata !== undefined && typeof customMetadata === 'object') {
        // Merge custom metadata, null values remove keys
        for (const [key, value] of Object.entries(customMetadata as Record<string, unknown>)) {
          if (value === null) {
            delete updatedMetadata[key];
          } else {
            updatedMetadata[key] = value;
          }
        }
      }

      updateData.metadata = updatedMetadata;
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // CRITICAL: Verify ownership
      .select()
      .single();

    if (error) {
      console.error('Update document error:', error);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: data,
    });
  } catch (error) {
    console.error('PATCH document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a document and all associated data (including entities & relations)
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // First, get the document - verify ownership and get file_size for usage tracking
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('file_path, file_size, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id) // CRITICAL: Verify ownership
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      console.error('Fetch document error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: 500 }
      );
    }

    // Store file path before deletion
    const filePath = document?.file_path;

    // Get chunk IDs for this document (needed to clean up entities/relations)
    const { data: chunks } = await supabaseAdmin
      .from('chunks')
      .select('id')
      .eq('document_id', documentId);

    const chunkIds = chunks?.map(c => c.id) || [];
    console.log(`[Delete Document] Found ${chunkIds.length} chunks to clean up entities/relations for`);

    // Delete entities and relations that reference these chunks
    // Entities/Relations store source_chunk_ids as a JSONB array
    if (chunkIds.length > 0) {
      let entitiesDeleted = 0;
      let relationsDeleted = 0;

      // For each chunk, find and delete entities/relations that reference it
      for (const chunkId of chunkIds) {
        // Delete relations where source_chunk_ids contains this chunk
        const { data: deletedRelations } = await supabaseAdmin
          .from('relations')
          .delete()
          .contains('source_chunk_ids', [chunkId])
          .eq('user_id', user.id)
          .select('id');

        relationsDeleted += deletedRelations?.length || 0;

        // Delete entities where source_chunk_ids contains this chunk
        const { data: deletedEntities } = await supabaseAdmin
          .from('entities')
          .delete()
          .contains('source_chunk_ids', [chunkId])
          .eq('user_id', user.id)
          .select('id');

        entitiesDeleted += deletedEntities?.length || 0;
      }

      console.log(`[Delete Document] Deleted ${entitiesDeleted} entities and ${relationsDeleted} relations`);
    }

    // Delete the document record
    // CASCADE constraints will automatically delete:
    // - chunks (via document_id foreign key)
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id); // CRITICAL: Verify ownership

    if (deleteError) {
      console.error('Delete document error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Decrement usage counters after successful deletion
    try {
      await usageService.decrementUsage(user.id, 'documents', 1);
      if (document?.file_size) {
        await usageService.decrementUsage(user.id, 'storage', document.file_size);
      }
    } catch (usageError) {
      console.error('Failed to decrement usage:', usageError);
      // Don't fail the delete if usage tracking fails
    }

    // Delete the file from storage after DB deletion succeeds
    let storageWarning: string | undefined;
    if (filePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        storageWarning = 'Document record deleted but file cleanup failed. The file may remain in storage.';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      ...(storageWarning && { warning: storageWarning }),
    });
  } catch (error) {
    console.error('DELETE document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
