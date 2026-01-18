import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Test connection
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check if profiles table exists
    const { error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        supabaseConnected: true,
        user: user ? { id: user.id, email: user.email } : null,
        profilesTableExists: !tableError || !tableError.message.includes('does not exist'),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
