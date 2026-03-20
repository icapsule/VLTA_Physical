import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

/**
 * Coach layout — validates that the current user has role='coach' or 'admin'.
 */
export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'role'> | null

  if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="/coach/dashboard" className="text-lg font-bold text-indigo-400">
            🎾 VLTA Coach
          </a>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/coach/dashboard" className="hover:text-white">全队总览</a>
            <a href="/coach/athletes" className="hover:text-white">学员管理</a>
            <a href="/coach/plans" className="hover:text-white">训练计划</a>
            {profile?.role === 'admin' && (
              <a href="/admin/users" className="text-yellow-400 hover:text-yellow-300">
                Admin ⚙️
              </a>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
