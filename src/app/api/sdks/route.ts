import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_sdks')
    .select(`
      id,
      slug,
      name,
      language,
      description_en,
      description_vi,
      icon,
      color,
      package_name,
      install_command,
      docs_url,
      github_url,
      npm_url,
      pypi_url,
      current_version,
      min_language_version,
      is_featured
    `)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
