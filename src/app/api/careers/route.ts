import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const department = searchParams.get('department');
  const location = searchParams.get('location');
  const type = searchParams.get('type');

  let query = supabase
    .from('cms_job_listings')
    .select(`
      id,
      slug,
      title_en,
      title_vi,
      location_en,
      location_vi,
      employment_type,
      experience_level,
      salary_range_min,
      salary_range_max,
      salary_currency,
      is_remote,
      department:cms_departments(id, slug, name_en, name_vi)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (department) {
    const { data: deptData } = await supabase
      .from('cms_departments')
      .select('id')
      .eq('slug', department)
      .single();

    if (deptData) {
      query = query.eq('department_id', deptData.id);
    }
  }

  if (location) {
    query = query.ilike('location_en', `%${location}%`);
  }

  if (type) {
    query = query.eq('employment_type', type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get departments for filtering
  const { data: departments } = await supabase
    .from('cms_departments')
    .select('slug, name_en, name_vi')
    .eq('is_active', true)
    .order('sort_order');

  return NextResponse.json({
    jobs: data,
    departments: departments || [],
  });
}
