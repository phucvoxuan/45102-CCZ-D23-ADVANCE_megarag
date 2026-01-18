import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get SDK
  const { data: sdk, error: sdkError } = await supabase
    .from('cms_sdks')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (sdkError) {
    return NextResponse.json({ error: 'SDK not found' }, { status: 404 });
  }

  // Get examples for this SDK
  const { data: examples } = await supabase
    .from('cms_sdk_examples')
    .select('id, slug, title_en, title_vi, description_en, description_vi, code, is_featured')
    .eq('sdk_id', sdk.id)
    .eq('is_published', true)
    .order('sort_order');

  return NextResponse.json({
    ...sdk,
    examples: examples || [],
  });
}
