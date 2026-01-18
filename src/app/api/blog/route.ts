import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category');
  const tagSlug = searchParams.get('tag');
  const featured = searchParams.get('featured');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('cms_blog_posts')
    .select(`
      id, slug, title_en, title_vi, excerpt_en, excerpt_vi,
      featured_image_url, author_name, author_avatar_url,
      reading_time, is_featured, published_at, view_count,
      category:cms_blog_categories(id, slug, name_en, name_vi, color),
      tags:cms_blog_post_tags(
        tag:cms_blog_tags(id, slug, name_en, name_vi)
      )
    `, { count: 'exact' })
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    const { data: category } = await supabase
      .from('cms_blog_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (category) {
      query = query.eq('category_id', category.id);
    }
  }

  if (featured === 'true') {
    query = query.eq('is_featured', true);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten tags and filter by tag if needed
  let posts = data?.map(post => ({
    ...post,
    tags: (post.tags as unknown as Array<{ tag: { slug: string } }> || [])
      .map((t) => t.tag)
      .filter(Boolean) as Array<{ slug: string }>
  })) || [];

  if (tagSlug) {
    posts = posts.filter(post =>
      post.tags.some((tag) => tag.slug === tagSlug)
    );
  }

  return NextResponse.json({
    posts,
    total: count,
    limit,
    offset
  });
}
