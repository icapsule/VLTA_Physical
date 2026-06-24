'use server'

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

/**
 * Merge a virtual athlete profile into a real registered user profile.
 * This transfers all test results, assessments, and plan assignments to the real user,
 * then deletes the virtual profile.
 */
export async function mergeAthletes(virtualId: string, realId: string) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  // Use a service role or direct connection to bypass any RLS for this critical merge operation.
  // We don't want partial merges due to RLS blocking some tables.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Verify caller is an admin
  const { data: adminProfile, error: adminErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (adminErr || adminProfile?.role !== 'admin') {
    return { success: false, error: 'Only admins can perform merges' }
  }

  try {
    // 2. Fetch both profiles
    const { data: virtualProfile, error: vpErr } = await supabase.from('profiles').select('*').eq('id', virtualId).single()
    const { data: realProfile, error: rpErr } = await supabase.from('profiles').select('*').eq('id', realId).single()

    if (vpErr || rpErr) throw new Error('Failed to fetch profiles for merge')

    // 3. Prepare payload for merging profile data
    // Real data takes precedence. Only copy over if real profile is missing the data.
    const profileUpdates: Record<string, any> = {}
    const mergeableFields = ['phone', 'gender', 'birth_date', 'height_cm', 'weight_kg']
    
    for (const field of mergeableFields) {
      if ((realProfile[field] === null || realProfile[field] === undefined) && virtualProfile[field] !== null) {
        profileUpdates[field] = virtualProfile[field]
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateProfileErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', realId)
      if (updateProfileErr) throw updateProfileErr
    }

    // 4. Update assessments (CRITICAL: prevents ON DELETE CASCADE wiping out results when profile is deleted)
    const { error: errAssessments } = await supabase
      .from('assessments')
      .update({ athlete_id: realId })
      .eq('athlete_id', virtualId)
    if (errAssessments) throw errAssessments

    // 3. Update assessment_results
    const { error: err2 } = await supabase
      .from('assessment_results')
      .update({ athlete_id: realId })
      .eq('athlete_id', virtualId)
    if (err2) throw err2

    // 5. Update coach_athlete_assignments
    const { error: err4 } = await supabase
      .from('coach_athlete_assignments')
      .update({ athlete_id: realId })
      .eq('athlete_id', virtualId)
    if (err4) throw err4

    // 8. Delete the virtual profile
    const { error: err5 } = await supabase
      .from('profiles')
      .delete()
      .eq('id', virtualId)
    if (err5) throw err5

    revalidatePath('/admin/users')
    revalidatePath('/coach/athletes')
    return { success: true }
  } catch (error: any) {
    console.error('Merge Athletes Error:', error)
    return { success: false, error: error.message || 'Failed to merge athletes' }
  }
}

export async function toggleMetricInRadar(metricId: string, inRadar: boolean) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Authenticate & Authorize
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Permission denied. Only admins can configure metrics.' }
    }

    // 2. Update DB
    const { error } = await supabase
      .from('test_metrics')
      .update({ in_radar: inRadar })
      .eq('id', metricId)

    if (error) {
      console.error('toggleMetricInRadar DB Error:', error)
      return { success: false, error: 'Database update failed' }
    }

    revalidatePath('/admin/metrics')
    revalidatePath('/coach/athletes')
    revalidatePath('/profile')

    return { success: true }
  } catch (error: any) {
    console.error('toggleMetricInRadar exception:', error)
    return { success: false, error: error.message || 'Internal error' }
  }
}
