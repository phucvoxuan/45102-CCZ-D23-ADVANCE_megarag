import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/auth-server';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  description?: string;
}

// Empty response for when tables don't exist
const EMPTY_GRAPH_RESPONSE = {
  success: true,
  data: {
    nodes: [],
    edges: [],
    available_entity_types: [],
    meta: {
      node_count: 0,
      edge_count: 0,
      limit_applied: 100,
    },
  },
};

/**
 * GET /api/admin/knowledge-graph - Get knowledge graph data for current user
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const entityType = searchParams.get('entity_type');
  const centerEntity = searchParams.get('center');

  try {
    let entityIds: string[] = [];

    if (centerEntity) {
      // Get entities connected to the center entity through relations (for current user)
      const { data: centerRelations, error: relError } = await supabaseAdmin
        .from('relations')
        .select('source_entity_id, target_entity_id')
        .eq('user_id', user.id)
        .or(`source_entity_id.eq.${centerEntity},target_entity_id.eq.${centerEntity}`);

      // Handle schema cache errors
      if (relError && (relError.code === 'PGRST205' || relError.message?.includes('does not exist'))) {
        return NextResponse.json({
          ...EMPTY_GRAPH_RESPONSE,
          warning: 'Knowledge graph tables not available. Please run database migrations.',
        });
      }

      const connectedEntities = new Set<string>([centerEntity]);
      centerRelations?.forEach(r => {
        connectedEntities.add(r.source_entity_id);
        connectedEntities.add(r.target_entity_id);
      });
      entityIds = Array.from(connectedEntities).slice(0, limit);
    }

    // Get entities (nodes) for current user
    let entitiesQuery = supabaseAdmin
      .from('entities')
      .select('id, entity_name, entity_type, description')
      .eq('user_id', user.id)
      .limit(limit);

    if (entityType) {
      entitiesQuery = entitiesQuery.eq('entity_type', entityType);
    }

    if (entityIds.length > 0) {
      entitiesQuery = entitiesQuery.in('id', entityIds);
    }

    const { data: entities, error: entitiesError } = await entitiesQuery;

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      // Handle table not found or schema cache errors gracefully
      if (entitiesError.code === 'PGRST205' || entitiesError.message?.includes('does not exist')) {
        return NextResponse.json({
          ...EMPTY_GRAPH_RESPONSE,
          warning: 'Entities table not available. Please run database migrations.',
        });
      }
      return NextResponse.json({ success: false, error: 'Failed to fetch entities' }, { status: 500 });
    }

    const fetchedEntityIds = entities?.map(e => e.id) || [];

    // Get relations (edges) between these entities for current user
    let relationsQuery = supabaseAdmin
      .from('relations')
      .select('id, source_entity_id, target_entity_id, relation_type, description')
      .eq('user_id', user.id);

    if (fetchedEntityIds.length > 0) {
      // Get relations where both source and target are in our entity list
      relationsQuery = relationsQuery
        .in('source_entity_id', fetchedEntityIds)
        .in('target_entity_id', fetchedEntityIds);
    }

    const { data: relations, error: relationsError } = await relationsQuery.limit(limit * 2);

    if (relationsError) {
      console.error('Error fetching relations:', relationsError);
      return NextResponse.json({ success: false, error: 'Failed to fetch relations' }, { status: 500 });
    }

    // Transform to graph format
    const nodes: GraphNode[] = (entities || []).map(e => ({
      id: e.id,
      name: e.entity_name,
      type: e.entity_type,
      description: e.description,
    }));

    const edges: GraphEdge[] = (relations || []).map(r => ({
      id: r.id,
      source: r.source_entity_id,
      target: r.target_entity_id,
      type: r.relation_type,
      description: r.description,
    }));

    // Get available entity types for filtering (for current user)
    const { data: types } = await supabaseAdmin
      .from('entities')
      .select('entity_type')
      .eq('user_id', user.id);

    const uniqueTypes = [...new Set(types?.map(t => t.entity_type) || [])];

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
        available_entity_types: uniqueTypes,
        meta: {
          node_count: nodes.length,
          edge_count: edges.length,
          limit_applied: limit,
        },
      },
    });
  } catch (error) {
    console.error('Knowledge graph error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch knowledge graph' }, { status: 500 });
  }
}
