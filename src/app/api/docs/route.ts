import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Get categories with article counts
  const { data: categories, error: catError } = await supabase
    .from('cms_doc_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 500 });
  }

  // Get article counts per category
  const { data: articles } = await supabase
    .from('cms_doc_articles')
    .select('category_id')
    .eq('is_published', true);

  const articleCounts = (articles || []).reduce((acc, article) => {
    if (article.category_id) {
      acc[article.category_id] = (acc[article.category_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoriesWithCounts = categories?.map(cat => ({
    ...cat,
    article_count: articleCounts[cat.id] || 0
  }));

  return NextResponse.json(categoriesWithCounts);
}
