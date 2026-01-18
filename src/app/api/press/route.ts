import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'all'; // releases, coverage, kit, videos, facts, all

  const result: {
    releases?: unknown[];
    coverage?: unknown[];
    kit?: unknown[];
    videos?: unknown[];
    facts?: unknown[];
  } = {};

  if (type === 'all' || type === 'releases') {
    const { data: releases } = await supabase
      .from('cms_press_releases')
      .select('id, slug, title_en, title_vi, excerpt_en, excerpt_vi, release_date, is_featured')
      .eq('is_published', true)
      .order('release_date', { ascending: false });
    result.releases = releases || [];
  }

  if (type === 'all' || type === 'coverage') {
    const { data: coverage } = await supabase
      .from('cms_news_coverage')
      .select('id, publication_name, publication_logo_url, article_title_en, article_title_vi, article_url, coverage_date, is_featured')
      .eq('is_active', true)
      .order('coverage_date', { ascending: false });
    result.coverage = coverage || [];
  }

  if (type === 'all' || type === 'kit') {
    const { data: kit } = await supabase
      .from('cms_press_kit')
      .select('id, name_en, name_vi, description_en, description_vi, file_url, file_type, file_size_kb, thumbnail_url')
      .eq('is_active', true)
      .order('sort_order');
    result.kit = kit || [];
  }

  if (type === 'all' || type === 'videos') {
    const { data: videos } = await supabase
      .from('cms_press_videos')
      .select('id, slug, title_en, title_vi, description_en, description_vi, video_url, thumbnail_url, video_type, duration, event_date')
      .eq('is_active', true)
      .order('sort_order');
    result.videos = videos || [];
  }

  if (type === 'all' || type === 'facts') {
    const { data: facts } = await supabase
      .from('cms_company_facts')
      .select('id, slug, label_en, label_vi, value, description_en, description_vi')
      .eq('is_active', true)
      .order('sort_order');
    result.facts = facts || [];
  }

  return NextResponse.json(result);
}
