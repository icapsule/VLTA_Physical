import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

/**
 * Admin layout — validates that the current user has role='admin'.
 */
export default async function AdminLayout({
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-yellow-900/50 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-yellow-400">⚙️ VLTA Admin</span>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/admin/users" className="hover:text-white">用户管理</a>
            <a href="/coach/dashboard" className="text-indigo-400 hover:text-indigo-300">
              Coach 视图
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
