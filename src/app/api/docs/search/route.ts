import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  // Full-text search
  const { data, error } = await supabase
    .from('cms_doc_articles')
    .select(`
      id, slug, title_en, title_vi, excerpt_en, excerpt_vi,
      category:cms_doc_categories(slug, name_en, name_vi)
    `)
    .eq('is_published', true)
    .or(`title_en.ilike.%${query}%,title_vi.ilike.%${query}%,content_en.ilike.%${query}%,content_vi.ilike.%${query}%`)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
