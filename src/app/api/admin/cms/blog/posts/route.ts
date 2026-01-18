import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('cms_blog_posts')
    .select(`
      *,
      category:cms_blog_categories(id, slug, name_en, name_vi, color),
      tags:cms_blog_post_tags(
        tag:cms_blog_tags(id, slug, name_en, name_vi)
      )
    `)
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status === 'published') {
    query = query.eq('is_published', true);
  } else if (status === 'draft') {
    query = query.eq('is_published', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten tags structure
  const postsWithFlatTags = data?.map(post => ({
    ...post,
    tags: post.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || []
  }));

  return NextResponse.json(postsWithFlatTags);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tags, ...postData } = body;

  // Use auth client to verify user session
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use admin client to check profile (bypasses RLS)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create post using admin client (bypasses RLS)
  const { data: post, error: postError } = await supabaseAdmin
    .from('cms_blog_posts')
    .insert({
      ...postData,
      author_id: user.id,
      created_by: user.id,
      updated_by: user.id,
      published_at: postData.is_published ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  // Add tags if provided
  if (tags && tags.length > 0) {
    const tagRelations = tags.map((tagId: string) => ({
      post_id: post.id,
      tag_id: tagId
    }));

    await supabaseAdmin.from('cms_blog_post_tags').insert(tagRelations);
  }

  return NextResponse.json(post);
}
