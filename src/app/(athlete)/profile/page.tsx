import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/features/profile-form'

/**
 * Athlete profile edit page — Server Component that passes profile to client form.
 */
export default async function ProfilePage() {
  const supabase = await createClient()

  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clerkUser.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">个人资料</h1>
        <p className="mt-1 text-sm text-gray-400">管理你的基本信息和头像</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <ProfileForm
          profile={profile}
          userEmail={clerkUser.emailAddresses[0]?.emailAddress ?? ''}
          userId={clerkUser.id}
        />
      </div>
    </div>
  )
}
