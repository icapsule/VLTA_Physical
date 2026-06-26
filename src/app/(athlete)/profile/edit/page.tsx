import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditProfileClient from './client-page'

export const dynamic = 'force-dynamic'

export default async function EditProfilePage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect('/sign-in')
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const userEmail = user.emailAddresses[0]?.emailAddress || 'N/A'

  return (
    <div className="pt-4">
      <EditProfileClient 
        profile={profile as any} 
        userEmail={userEmail} 
        userId={userId} 
      />
    </div>
  )
}
