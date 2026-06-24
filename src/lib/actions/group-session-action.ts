'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface GroupSessionPayload {
  testDate: string
  results: {
    athleteId: string
    metricId: string
    value: string | boolean // string for numeric inputs, boolean for pass/fail
  }[]
}

export async function submitGroupSession(payload: GroupSessionPayload) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized: Coach must be logged in')

    const supabase = await createClient()

    // Process athletes to group their results
    const athleteIds = Array.from(new Set(payload.results.map(r => r.athleteId)))

    for (const athleteId of athleteIds) {
      // 1. Create Assessment (Session) for this athlete
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          athlete_id: athleteId,
          coach_id: userId,
          test_date: payload.testDate
        })
        .select('id')
        .single()

      if (assessmentError) {
        console.error('Failed to create assessment:', assessmentError)
        throw new Error('Failed to create assessment for athlete: ' + athleteId)
      }

      const assessmentId = assessmentData.id

      // 2. Prepare Assessment Results
      const athleteResults = payload.results.filter(r => r.athleteId === athleteId)
      const resultsToInsert = athleteResults.map(res => {
        const isPassed = typeof res.value === 'boolean' ? res.value : null
        const bestResult = typeof res.value === 'string' && res.value !== '' ? parseFloat(res.value) : null

        return {
          assessment_id: assessmentId,
          metric_id: res.metricId,
          athlete_id: athleteId,
          best_result: bestResult,
          is_passed: isPassed,
        }
      })

      // Filter out empty string results before inserting
      const validResults = resultsToInsert.filter(r => r.best_result !== null || r.is_passed !== null)

      if (validResults.length > 0) {
        const { error: resultsError } = await supabase
          .from('assessment_results')
          .insert(validResults)

        if (resultsError) {
          console.error('Failed to insert results:', resultsError)
          throw new Error('Failed to insert results for athlete: ' + athleteId)
        }
      }
    }

    revalidatePath('/coach/athletes', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
