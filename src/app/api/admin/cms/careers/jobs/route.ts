import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('cms_job_listings')
    .select(`
      *,
      department:cms_departments(id, slug, name_en, name_vi)
    `)
    .order('created_at', { ascending: false });

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
    .from('cms_job_listings')
    .insert(body)
    .select(`
      *,
      department:cms_departments(id, slug, name_en, name_vi)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
