import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_blog_posts')
    .select(`
      *,
      category:cms_blog_categories(id, slug, name_en, name_vi, color),
      tags:cms_blog_post_tags(
        tag:cms_blog_tags(id, slug, name_en, name_vi)
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Increment view count
  await supabase
    .from('cms_blog_posts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  // Flatten tags
  const post = {
    ...data,
    tags: data.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || []
  };

  return NextResponse.json(post);
}
