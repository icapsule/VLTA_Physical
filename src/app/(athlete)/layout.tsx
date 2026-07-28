import { auth } from '@clerk/nextjs/server'
import { SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import { cookies } from 'next/headers'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { getTranslator } from '@/lib/i18n'

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
  const cookieStore = await cookies()
  const initialLang = cookieStore.get('NEXT_LOCALE')?.value || 'zh'
  const t = await getTranslator()

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

  if (profile?.role === 'coach') redirect('/coach/athletes');
  if (profile?.role === 'admin') redirect('/admin/users');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-bold text-indigo-400">
            🎾 VTA Athlete Club <span className="text-gray-500 font-normal mx-2">|</span> 
            <span className="text-white">体能表现追踪看板 (Performance Tracking Dashboard)</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <LanguageSwitcher initialLang={initialLang} />
            <Link href="/profile/edit" className="hover:text-white transition-colors">
              {t("✍️ 编辑资料", "✍️ Edit Profile")}
            </Link>
            <SignOutButton>
              <button className="ml-4 rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">{t("退出登录", "Sign Out")}</button>
            </SignOutButton>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
