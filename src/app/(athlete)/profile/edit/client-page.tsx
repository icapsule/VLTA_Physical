'use client'

import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'
import ProfileForm from '@/components/features/profile-form'

export default function EditProfileClient({ profile, userEmail, userId }: { profile: Profile | null, userEmail: string, userId: string }) {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">编辑个人资料</h1>
        <button 
          onClick={() => router.push('/profile')}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← 返回我的大屏
        </button>
      </div>

      <ProfileForm 
        profile={profile} 
        userEmail={userEmail} 
        userId={userId} 
        onSuccess={() => {
          // Add a tiny delay so the user sees the "Success" green box
          setTimeout(() => {
            router.push('/profile')
            router.refresh() // Ensure dashboard picks up new stats
          }, 1000)
        }}
      />
    </div>
  )
}
