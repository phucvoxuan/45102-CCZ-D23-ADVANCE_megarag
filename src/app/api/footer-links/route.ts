import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cms_footer_links')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by section
  const grouped = data.reduce((acc, link) => {
    if (!acc[link.section]) {
      acc[link.section] = [];
    }
    acc[link.section].push(link);
    return acc;
  }, {} as Record<string, typeof data>);

  return NextResponse.json(grouped);
}
