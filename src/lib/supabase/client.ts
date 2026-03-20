import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a raw Supabase client for browser components.
 * IMPORTANT: In VLTA 2.0, client side supabase instances CANNOT bypass RLS.
 * Because we disabled RLS, this anon client CANNOT be used to blindly write data without server verification.
 * Use Server Actions for all writes instead.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
