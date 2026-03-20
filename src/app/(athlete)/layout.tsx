import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

/**
 * Athlete layout — validates that the current user has role='athlete'.
 * Redirects coach/admin to their respective dashboards.
 */
export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) {
    redirect('/sign-in')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'role'> | null

  if (profile?.role === 'coach') redirect('/coach/dashboard')
  if (profile?.role === 'admin') redirect('/admin/users')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/dashboard" className="text-lg font-bold text-indigo-400">
            🎾 VLTA Physical
          </a>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/dashboard" className="hover:text-white">仪表盘</a>
            <a href="/tests" className="hover:text-white">我的成绩</a>
            <a href="/plans" className="hover:text-white">训练计划</a>
            <a href="/profile" className="hover:text-white">个人资料</a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
