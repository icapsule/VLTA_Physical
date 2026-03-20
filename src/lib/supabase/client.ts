import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses @supabase/ssr for proper cookie handling.
 */
export function createClient(): SupabaseClient<any, "public", any> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}

