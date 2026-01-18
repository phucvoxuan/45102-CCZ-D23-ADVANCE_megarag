import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category: categorySlug, slug } = await params;
  const supabase = await createClient();

  // Get category
  const { data: category } = await supabase
    .from('cms_doc_categories')
    .select('id, slug, name_en, name_vi')
    .eq('slug', categorySlug)
    .single();

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Get article
  const { data: article, error } = await supabase
    .from('cms_doc_articles')
    .select('*')
    .eq('category_id', category.id)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  // Get prev/next articles for navigation
  const { data: siblings } = await supabase
    .from('cms_doc_articles')
    .select('id, slug, title_en, title_vi, sort_order')
    .eq('category_id', category.id)
    .eq('is_published', true)
    .order('sort_order');

  const currentIndex = siblings?.findIndex(s => s.id === article.id) || 0;
  const prev = siblings?.[currentIndex - 1] || null;
  const next = siblings?.[currentIndex + 1] || null;

  return NextResponse.json({
    article,
    category,
    navigation: { prev, next }
  });
}
