import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';

// Empty response for when table doesn't exist or is empty
const EMPTY_ENTITIES_RESPONSE = {
  success: true,
  data: {
    entities: [],
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
 * GET /api/admin/entities - List entities for current user
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
  const entityType = searchParams.get('type');
  const search = searchParams.get('search');
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('entities')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (search) {
      query = query.ilike('entity_name', `%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: entities, error, count } = await query;

    if (error) {
      console.error('Error fetching entities:', error);
      // Handle table not found or schema cache errors gracefully
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          ...EMPTY_ENTITIES_RESPONSE,
          warning: 'Entities table not available. Please run database migrations.',
        });
      }
      return NextResponse.json({ success: false, error: 'Failed to fetch entities' }, { status: 500 });
    }

    // Get entity types for filter dropdown
    const { data: types } = await supabaseAdmin
      .from('entities')
      .select('entity_type')
      .eq('user_id', user.id);

    const uniqueTypes = [...new Set(types?.map(t => t.entity_type) || [])];

    return NextResponse.json({
      success: true,
      data: {
        entities: entities || [],
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
    console.error('List entities error:', error);
    return NextResponse.json({ success: false, error: 'Failed to list entities' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/entities - Bulk delete entities for current user
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
  const entityIds: string[] = body.entity_ids;

  if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
    return NextResponse.json({ success: false, error: 'entity_ids array is required' }, { status: 400 });
  }

  try {
    // Only delete entities belonging to the current user
    const { error } = await supabaseAdmin
      .from('entities')
      .delete()
      .eq('user_id', user.id)
      .in('id', entityIds);

    if (error) {
      console.error('Error deleting entities:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete entities' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted_count: entityIds.length,
        message: `Successfully deleted ${entityIds.length} entities`,
      },
    });
  } catch (error) {
    console.error('Delete entities error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete entities' }, { status: 500 });
  }
}
