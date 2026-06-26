import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
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

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'role' | 'full_name'> | null

  if (!profile || (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'athlete')) {
    redirect('/profile')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href="/coach/athletes" className="text-lg font-bold text-indigo-400">
            🎾 VTA Athlete Club | Coach {profile?.full_name || 'Admin'}
          </a>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/coach/athletes" className="hover:text-white">学员管理</a>
            <a href="/coach/sessions/new" className="text-emerald-400 hover:text-emerald-300">批量集训录入</a>
            {profile?.role === 'admin' && (
              <a href="/admin/users" className="text-yellow-400 hover:text-yellow-300">
                Admin ⚙️
              </a>
            )}
            {/* Logout button */}
            <SignOutButton>
              <button className="ml-4 rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">退出登录</button>
            </SignOutButton>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
