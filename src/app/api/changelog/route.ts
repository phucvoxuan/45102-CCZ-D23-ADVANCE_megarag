import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type');
  const version = searchParams.get('version');

  const offset = (page - 1) * limit;

  let query = supabase
    .from('cms_changelog_entries')
    .select(`
      id,
      version,
      title_en,
      title_vi,
      content_en,
      content_vi,
      release_date,
      is_major,
      type:cms_changelog_types(id, slug, name_en, name_vi, color, icon)
    `, { count: 'exact' })
    .eq('is_published', true)
    .order('release_date', { ascending: false });

  if (type) {
    const { data: typeData } = await supabase
      .from('cms_changelog_types')
      .select('id')
      .eq('slug', type)
      .single();

    if (typeData) {
      query = query.eq('type_id', typeData.id);
    }
  }

  if (version) {
    query = query.ilike('version', `%${version}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get available types for filtering
  const { data: types } = await supabase
    .from('cms_changelog_types')
    .select('slug, name_en, name_vi, color, icon')
    .order('sort_order');

  return NextResponse.json({
    entries: data,
    types: types || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
