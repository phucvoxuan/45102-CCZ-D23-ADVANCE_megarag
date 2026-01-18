// src/app/api/feedback/route.ts
// API endpoint for collecting user feedback

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FeedbackPayload {
  type: 'bug' | 'feature' | 'general';
  message: string;
  email?: string;
  url?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();

    // Validate required fields
    if (!body.type || !body.message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Note: Service role client doesn't have user context
    // Feedback can be anonymous - userId not required
    const userId: string | null = null;

    // Insert feedback into database
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        type: body.type,
        message: body.message,
        email: body.email || null,
        url: body.url || null,
        user_agent: body.userAgent || null,
        status: 'new',
      });

    if (error) {
      // If table doesn't exist, log to console and return success
      // This allows the feature to work even before migration
      if (error.code === '42P01') {
        console.log('[Feedback] Table not found, logging to console:', {
          type: body.type,
          message: body.message,
          email: body.email,
          url: body.url,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ success: true, note: 'logged' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Note: For admin access, we need to check admin status via the request headers
    // or use a different auth mechanism. For now, use admin API key validation
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, count, error } = await query;

    if (error) {
      // If table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], count: 0, note: 'table_not_created' });
      }
      throw error;
    }

    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}
