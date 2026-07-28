import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { getTranslator } from '@/lib/i18n'

/**
 * Admin layout — validates that the current user has role='admin'.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const initialLang = cookieStore.get('NEXT_LOCALE')?.value || 'zh'
  const t = await getTranslator()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<Profile, 'role' | 'full_name'> | null

  if (profile?.role !== 'admin') {
    redirect('/profile')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-yellow-900/50 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-yellow-400">🎾 VTA Athlete Club | Admin {profile?.full_name || ''}</span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <LanguageSwitcher initialLang={initialLang} />
            <a href="/admin/users" className="hover:text-white transition-colors">{t("用户管理", "User Management")}</a>
            <a href="/admin/metrics" className="hover:text-white transition-colors">{t("指标管理", "Test & Training Metrics")}</a>
            <a href="/coach/athletes" className="text-indigo-400 hover:text-indigo-300 ml-4 border-l border-gray-800 pl-4">
              &larr; {t("回到教练端", "Back to Coach")}
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
