import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('cms_job_applications')
    .select(`
      *,
      job:cms_job_listings(id, slug, title_en, title_vi, department:cms_departments(name_en, name_vi))
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
