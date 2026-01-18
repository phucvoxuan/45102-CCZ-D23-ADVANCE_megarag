'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance to prevent "Multiple GoTrueClient instances" warning
let browserClientInstance: SupabaseClient | null = null;

/**
 * Creates a Supabase client for browser/client components
 * Uses @supabase/ssr for proper cookie handling with Next.js
 * Implements singleton pattern to avoid multiple GoTrueClient instances
 */
export function createClient(): SupabaseClient {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  browserClientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as SupabaseClient;

  return browserClientInstance;
}
