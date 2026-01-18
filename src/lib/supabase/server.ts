import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Server-side Supabase client (uses service role key)
// This bypasses RLS and should only be used in server-side code
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Required tables for AIDORag
export const REQUIRED_TABLES = [
  'documents',
  'chunks',
  'entities',
  'relations',
  'chat_sessions',
  'chat_messages',
] as const;

// Test connection and check if tables exist
export async function testConnection(): Promise<{
  connected: boolean;
  tables: { name: string; exists: boolean }[];
  error?: string;
}> {
  try {
    const tableChecks = await Promise.all(
      REQUIRED_TABLES.map(async (table) => {
        try {
          const { error } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true })
            .limit(0);

          return {
            name: table,
            exists: !error || !error.message.includes('does not exist'),
          };
        } catch {
          return { name: table, exists: false };
        }
      })
    );

    return {
      connected: true,
      tables: tableChecks,
    };
  } catch (error) {
    return {
      connected: false,
      tables: REQUIRED_TABLES.map(name => ({ name, exists: false })),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Helper: Execute with timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

// Wrapper function for API routes compatibility
export async function createClient() {
  return supabaseAdmin;
}

export default supabaseAdmin;
