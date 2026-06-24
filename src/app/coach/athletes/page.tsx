import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AthleteList from './AthleteList'

/**
 * Coach athletes list page with search.
 */
export default async function AthletesPage() {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, birth_date, height_cm, weight_kg, phone, gender')
    .eq('role', 'athlete')

  return <AthleteList initialAthletes={athletes ?? []} />
}
