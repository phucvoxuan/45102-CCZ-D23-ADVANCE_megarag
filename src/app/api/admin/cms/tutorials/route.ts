import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topic');
  const levelId = searchParams.get('level');

  let query = supabaseAdmin
    .from('cms_tutorials')
    .select(`
      *,
      level:cms_tutorial_levels(id, slug, name_en, name_vi, color),
      topic:cms_tutorial_topics(id, slug, name_en, name_vi, icon)
    `)
    .order('sort_order');

  if (topicId) query = query.eq('topic_id', topicId);
  if (levelId) query = query.eq('level_id', levelId);

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

  // Use admin client to insert (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from('cms_tutorials')
    .insert({
      ...body,
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
