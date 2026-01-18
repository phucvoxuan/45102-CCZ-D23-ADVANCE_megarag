import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_tutorials')
    .select(`
      *,
      level:cms_tutorial_levels(id, slug, name_en, name_vi, color),
      topic:cms_tutorial_topics(id, slug, name_en, name_vi, icon)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
  }

  // Increment view count
  await supabase
    .from('cms_tutorials')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return NextResponse.json(data);
}
