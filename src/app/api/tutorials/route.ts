import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const topicSlug = searchParams.get('topic');
  const levelSlug = searchParams.get('level');
  const featured = searchParams.get('featured');

  let query = supabase
    .from('cms_tutorials')
    .select(`
      id, slug, title_en, title_vi, description_en, description_vi,
      thumbnail_url, video_url, duration_minutes, reading_time,
      view_count, is_featured,
      level:cms_tutorial_levels(id, slug, name_en, name_vi, color),
      topic:cms_tutorial_topics(id, slug, name_en, name_vi, icon)
    `)
    .eq('is_published', true)
    .order('sort_order');

  if (featured === 'true') {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let tutorials = data || [];

  if (topicSlug) {
    tutorials = tutorials.filter(t => (t.topic as { slug?: string } | null)?.slug === topicSlug);
  }
  if (levelSlug) {
    tutorials = tutorials.filter(t => (t.level as { slug?: string } | null)?.slug === levelSlug);
  }

  return NextResponse.json(tutorials);
}
