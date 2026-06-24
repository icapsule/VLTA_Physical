'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

interface UpdatePayload {
  resultId: string
  newDate: string
  newResult: number | null
  newIsPassed: boolean | null
}

export async function updateAssessmentLog({ resultId, newDate, newResult, newIsPassed }: UpdatePayload) {
  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
      return { success: false, error: 'Permission denied. Only coaches can edit logs.' }
    }

    // 2. Fetch the existing record to see if we need to change the date
    const { data: existingResult, error: fetchErr } = await supabase
      .from('assessment_results')
      .select('*, assessments(test_date, coach_id, athlete_id)')
      .eq('id', resultId)
      .single()

    if (fetchErr || !existingResult) {
      return { success: false, error: 'Record not found' }
    }

    const currentAssessment = existingResult.assessments as any
    let finalAssessmentId = existingResult.assessment_id

    // 3. Handle Date Change
    if (currentAssessment.test_date !== newDate) {
      // Coach is moving this record to a different date.
      // Check if an assessment already exists for this athlete on the new date.
      const { data: targetAssessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('athlete_id', existingResult.athlete_id)
        .eq('test_date', newDate)
        .maybeSingle()

      if (targetAssessment) {
        finalAssessmentId = targetAssessment.id
      } else {
        // Create a new assessment group session for this date
        const { data: newAssessment, error: createErr } = await supabase
          .from('assessments')
          .insert({
            athlete_id: existingResult.athlete_id,
            coach_id: userId, // Assuming the editor claims it, or keep original currentAssessment.coach_id
            test_date: newDate,
          })
          .select('id')
          .single()

        if (createErr || !newAssessment) {
          return { success: false, error: 'Failed to create new assessment date group.' }
        }
        finalAssessmentId = newAssessment.id
      }
    }

    // 4. Update the assessment_results row
    const { error: updateErr } = await supabase
      .from('assessment_results')
      .update({
        assessment_id: finalAssessmentId,
        best_result: newResult,
        is_passed: newIsPassed
      })
      .eq('id', resultId)

    if (updateErr) {
      return { success: false, error: 'Failed to update record.' }
    }

    revalidatePath('/coach/athletes')
    revalidatePath('/profile')

    return { success: true }
  } catch (error: any) {
    console.error('Update Assessment Error:', error)
    return { success: false, error: error.message || 'Internal error' }
  }
}

export async function deleteAssessmentLog(resultId: string) {
  try {
    const supabase = await createClient()

    // 1. Authenticate & Authorize
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
      return { success: false, error: 'Permission denied. Only coaches can delete logs.' }
    }

    // 2. Delete the assessment_results row
    const { error: deleteErr } = await supabase
      .from('assessment_results')
      .delete()
      .eq('id', resultId)

    if (deleteErr) {
      return { success: false, error: 'Failed to delete record.' }
    }

    revalidatePath('/coach/athletes')
    revalidatePath('/profile')

    return { success: true }
  } catch (error: any) {
    console.error('Delete Assessment Error:', error)
    return { success: false, error: error.message || 'Internal error' }
  }
}
