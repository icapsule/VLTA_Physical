import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const ROLE_REDIRECT: Record<UserRole, string> = {
  athlete: '/dashboard',
  coach: '/coach/dashboard',
  admin: '/admin/users',
}

/**
 * OAuth callback handler.
 * Exchanges the auth code for a session and redirects based on user role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = ((profileData as { role?: string } | null)?.role ?? 'athlete') as UserRole
        const redirectPath = ROLE_REDIRECT[role] ?? next

        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // On error, redirect back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
