/**
 * Re-export the singleton Supabase browser client
 * This ensures only ONE GoTrueClient instance exists in the browser
 *
 * All client-side code should import from this file or auth-client.ts
 * Both point to the same singleton instance
 */
import { createClient } from './auth-client';

// Create and export the singleton instance
export const supabase = createClient();

export default supabase;
