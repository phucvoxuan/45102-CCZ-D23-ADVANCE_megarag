import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('cms_blog_posts')
    .select(`
      *,
      category:cms_blog_categories(id, slug, name_en, name_vi, color),
      tags:cms_blog_post_tags(
        tag:cms_blog_tags(id, slug, name_en, name_vi)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten tags
  const postWithFlatTags = {
    ...data,
    tags: data.tags?.map((t: { tag: unknown }) => t.tag).filter(Boolean) || []
  };

  return NextResponse.json(postWithFlatTags);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Get current post to check published status change
  const { data: currentPost } = await supabaseAdmin
    .from('cms_blog_posts')
    .select('is_published, published_at')
    .eq('id', id)
    .single();

  // Set published_at if being published for first time
  let published_at = currentPost?.published_at;
  if (postData.is_published && !currentPost?.is_published) {
    published_at = new Date().toISOString();
  }

  // Update post using admin client (bypasses RLS)
  const { data: post, error: postError } = await supabaseAdmin
    .from('cms_blog_posts')
    .update({
      ...postData,
      published_at,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  // Update tags if provided
  if (tags !== undefined) {
    // Remove existing tags
    await supabaseAdmin
      .from('cms_blog_post_tags')
      .delete()
      .eq('post_id', id);

    // Add new tags
    if (tags && tags.length > 0) {
      const tagRelations = tags.map((tagId: string) => ({
        post_id: id,
        tag_id: tagId
      }));

      await supabaseAdmin.from('cms_blog_post_tags').insert(tagRelations);
    }
  }

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // Delete tags first (cascade should handle this, but being explicit)
  await supabaseAdmin
    .from('cms_blog_post_tags')
    .delete()
    .eq('post_id', id);

  // Delete post using admin client (bypasses RLS)
  const { error } = await supabaseAdmin
    .from('cms_blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
