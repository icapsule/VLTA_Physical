import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TestItem, Profile } from '@/lib/supabase/types'
import AthleteProfileContainer from '@/components/features/athlete-profile-container'
import AthleteProgressChart from '@/components/features/athlete-progress-chart'
import AssessmentLogTable from '@/components/features/assessment-log-table'
import { displayMetricValue } from '@/lib/utils/format'
import CopyShareLinkButton from '@/components/features/copy-share-link-button'

export default async function AthleteDetailPage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = await params
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  // Fetch profile to determine role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileData as Pick<Profile, 'role'> | null

  // If the logged‑in user is an athlete, send them to the shared list view
  if (profile?.role === 'athlete') redirect('/coach/athletes')

  // Existing athlete detail logic (unchanged)
  const { data: athlete } = await supabase.from('profiles').select('*').eq('id', athleteId).eq('role', 'athlete').single()
  if (!athlete) notFound()

  const { data: results } = await supabase
    .from('assessment_results')
    .select(`
      id,
      metric_id,
      attempts,
      best_result,
      is_passed,
      test_metrics(name_zh, unit, higher_is_better, record_type),
      assessments(test_date)
    `)
    .eq('athlete_id', athleteId)

  // Sort by test_date descending
  const sortedResults = (results ?? []).sort((a, b) => {
    // @ts-ignore
    const dateA = a.assessments?.test_date || '1900-01-01'
    // @ts-ignore
    const dateB = b.assessments?.test_date || '1900-01-01'
    return dateB.localeCompare(dateA)
  })

  // Build latestByMetricId
  const latestByMetricId: Record<string, number | boolean> = {}
  for (const r of sortedResults) {
    const metrics = r.test_metrics as any
    if (metrics?.record_type === 'test' && latestByMetricId[r.metric_id] === undefined) {
      latestByMetricId[r.metric_id] = Number(r.best_result)
    }
  }

  const age = athlete.birth_date
    ? new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()
    : 10

  // Fetch all TEST metrics (Exclude training) for PB
  const { data: metricsData } = await supabase
    .from('test_metrics')
    .select('*')
    .eq('record_type', 'test')

  const testMetrics = (metricsData || []) as TestItem[]

  // Build PB Map
  const pbs: Record<string, { value: number; date: string } | null> = {}
  
  testMetrics.forEach(metric => {
    const metricRecords = sortedResults.filter(r => r.metric_id === metric.id && r.best_result !== null)

    if (metricRecords.length === 0) {
      pbs[metric.id] = null
    } else {
      let bestRecord = metricRecords[0]
      for (let i = 1; i < metricRecords.length; i++) {
        const current = metricRecords[i]
        const currentVal = Number(current.best_result)
        const bestVal = Number(bestRecord.best_result)
        if (metric.higher_is_better) {
          if (currentVal > bestVal) bestRecord = current
        } else {
          if (currentVal < bestVal) bestRecord = current
        }
      }

      // @ts-ignore
      const testDate = bestRecord.assessments?.test_date || '未知日期'

      pbs[metric.id] = {
        value: Number(bestRecord.best_result),
        date: testDate
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <a href="/coach/athletes" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← 返回学员列表
        </a>
        <CopyShareLinkButton token={athlete.share_token} />
      </div>

      {/* Shared Dashboard Container */}
      <AthleteProfileContainer 
        athlete={athlete as any}
        results={latestByMetricId} 
        metrics={testMetrics}
        age={age} 
        pbs={pbs}
      />

      {/* Progress Chart (Only shows 'test' records) */}
      <AthleteProgressChart 
        results={sortedResults.filter(r => (r.test_metrics as any)?.record_type === 'test') as any} 
        metrics={testMetrics}
      />

      {/* Hybrid Training & Test Log */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 font-semibold text-white">训练与测试日志</h2>
        <AssessmentLogTable results={sortedResults} isEditable={true} />
      </div>
    </div>
  )
}
