import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';

interface RelationWithNames {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  source_entity_name: string;
  target_entity_name: string;
  source_entity_type: string;
  target_entity_type: string;
  relation_type: string;
  description: string | null;
  source_chunk_ids: string[];
  created_at: string;
}

// Empty response for when table doesn't exist or is empty
const EMPTY_RELATIONS_RESPONSE = {
  success: true,
  data: {
    relations: [],
    available_types: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      total_pages: 0,
    },
  },
};

/**
 * GET /api/admin/relations - List relations with entity names for current user
 */
export async function GET(request: NextRequest) {
  // Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const relationType = searchParams.get('type');
  const search = searchParams.get('search');
  const offset = (page - 1) * limit;

  try {
    // First get relations for current user
    let query = supabaseAdmin
      .from('relations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (relationType) {
      query = query.eq('relation_type', relationType);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: relations, error, count } = await query;

    if (error) {
      console.error('Error fetching relations:', error);
      // Handle table not found or schema cache errors gracefully
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          ...EMPTY_RELATIONS_RESPONSE,
          warning: 'Relations table not available. Please run database migrations.',
        });
      }
      return NextResponse.json({ success: false, error: 'Failed to fetch relations' }, { status: 500 });
    }

    // Get all unique entity IDs from relations
    const entityIds = new Set<string>();
    relations?.forEach(r => {
      if (r.source_entity_id) entityIds.add(r.source_entity_id);
      if (r.target_entity_id) entityIds.add(r.target_entity_id);
    });

    // Fetch entity names
    const { data: entities } = await supabaseAdmin
      .from('entities')
      .select('id, entity_name, entity_type')
      .in('id', Array.from(entityIds));

    const entityMap = new Map(entities?.map(e => [e.id, { name: e.entity_name, type: e.entity_type }]) || []);

    // Enrich relations with entity names
    let enrichedRelations: RelationWithNames[] = (relations || []).map(r => ({
      id: r.id,
      source_entity_id: r.source_entity_id,
      target_entity_id: r.target_entity_id,
      source_entity_name: entityMap.get(r.source_entity_id)?.name || 'Unknown',
      target_entity_name: entityMap.get(r.target_entity_id)?.name || 'Unknown',
      source_entity_type: entityMap.get(r.source_entity_id)?.type || 'UNKNOWN',
      target_entity_type: entityMap.get(r.target_entity_id)?.type || 'UNKNOWN',
      relation_type: r.relation_type,
      description: r.description,
      source_chunk_ids: r.source_chunk_ids || [],
      created_at: r.created_at,
    }));

    // Filter by search if provided (search in entity names or description)
    if (search) {
      const searchLower = search.toLowerCase();
      enrichedRelations = enrichedRelations.filter(r =>
        r.source_entity_name.toLowerCase().includes(searchLower) ||
        r.target_entity_name.toLowerCase().includes(searchLower) ||
        (r.description && r.description.toLowerCase().includes(searchLower))
      );
    }

    // Get relation types for filter dropdown
    const { data: types } = await supabaseAdmin
      .from('relations')
      .select('relation_type')
      .eq('user_id', user.id);

    const uniqueTypes = [...new Set(types?.map(t => t.relation_type) || [])];

    return NextResponse.json({
      success: true,
      data: {
        relations: enrichedRelations,
        available_types: uniqueTypes,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('List relations error:', error);
    return NextResponse.json({ success: false, error: 'Failed to list relations' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/relations - Bulk delete relations for current user
 */
export async function DELETE(request: NextRequest) {
  // Authenticate user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const relationIds: string[] = body.relation_ids;

  if (!relationIds || !Array.isArray(relationIds) || relationIds.length === 0) {
    return NextResponse.json({ success: false, error: 'relation_ids array is required' }, { status: 400 });
  }

  try {
    // Only delete relations belonging to the current user
    const { error } = await supabaseAdmin
      .from('relations')
      .delete()
      .eq('user_id', user.id)
      .in('id', relationIds);

    if (error) {
      console.error('Error deleting relations:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete relations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted_count: relationIds.length,
        message: `Successfully deleted ${relationIds.length} relations`,
      },
    });
  } catch (error) {
    console.error('Delete relations error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete relations' }, { status: 500 });
  }
}
