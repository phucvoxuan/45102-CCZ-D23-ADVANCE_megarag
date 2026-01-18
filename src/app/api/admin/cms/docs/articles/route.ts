import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');

  let query = supabaseAdmin
    .from('cms_doc_articles')
    .select(`
      *,
      category:cms_doc_categories(id, slug, name_en, name_vi, icon)
    `)
    .order('sort_order');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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

  // Calculate reading time
  const readingTime = Math.max(1, Math.ceil((body.content_en || '').split(/\s+/).length / 200));

  // Use admin client to insert (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from('cms_doc_articles')
    .insert({
      ...body,
      reading_time: readingTime,
      created_by: user.id,
      updated_by: user.id,
      published_at: body.is_published ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
