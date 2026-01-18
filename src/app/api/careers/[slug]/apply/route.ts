import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const body = await request.json();

  // Find the job by slug
  const { data: job, error: jobError } = await supabase
    .from('cms_job_listings')
    .select('id')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Create the application
  const { data, error } = await supabase
    .from('cms_job_applications')
    .insert({
      job_id: job.id,
      applicant_name: body.applicant_name,
      applicant_email: body.applicant_email,
      applicant_phone: body.applicant_phone || null,
      resume_url: body.resume_url || null,
      cover_letter: body.cover_letter || null,
      linkedin_url: body.linkedin_url || null,
      portfolio_url: body.portfolio_url || null,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
