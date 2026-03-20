import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a raw Supabase client.
 * Decoupled from SSR cookies since VLTA 2.0 uses Clerk for Auth.
 */
export async function createClient(): Promise<SupabaseClient<any, "public", any>> {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}
