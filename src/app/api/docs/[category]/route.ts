import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: categorySlug } = await params;
  const supabase = await createClient();

  // Get category
  const { data: category, error: catError } = await supabase
    .from('cms_doc_categories')
    .select('*')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .single();

  if (catError || !category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Get articles in category
  const { data: articles, error: artError } = await supabase
    .from('cms_doc_articles')
    .select(`
      id, slug, title_en, title_vi, excerpt_en, excerpt_vi,
      reading_time, sort_order, is_featured
    `)
    .eq('category_id', category.id)
    .eq('is_published', true)
    .order('sort_order');

  if (artError) {
    return NextResponse.json({ error: artError.message }, { status: 500 });
  }

  return NextResponse.json({
    category,
    articles
  });
}
