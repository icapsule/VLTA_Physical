import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { TestItem } from '@/lib/supabase/types'
import AthleteProfileContainer from '@/components/features/athlete-profile-container'
import AthleteProgressChart from '@/components/features/athlete-progress-chart'
import AssessmentLogTable from '@/components/features/assessment-log-table'

// Force Next.js to not cache this if it needs live updates, though static would be faster
export const dynamic = 'force-dynamic'

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // 1. We instantiate a Service Role client to bypass RLS securely on the server.
  // This allows the public to read ONLY the data matching their token.
  // We NEVER pass this client to the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return <div className="text-white p-8">Server Configuration Error</div>
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 2. Look up the athlete by their secret share_token
  const { data: athlete } = await supabase
    .from('profiles')
    .select('*')
    .eq('share_token', token)
    .single()

  if (!athlete) {
    // Unguessable token -> 404 if not found
    notFound()
  }

  const athleteId = athlete.id

  // 3. Fetch all required assessment data (Copied from the Coach UI)
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

  // Fetch all TEST metrics
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
      pbs[metric.id] = { value: Number(bestRecord.best_result), date: testDate }
    }
  })

  return (
    <div className="min-h-screen bg-black px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Simple Header for public viewers */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            🎾 VTA Athlete Club <span className="text-gray-500 font-normal">|</span> <span className="text-indigo-400">体能表现追踪看板 (Performance Tracking Dashboard)</span>
          </h1>
          <div className="text-sm text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            只读模式
          </div>
        </div>

        {/* Shared Dashboard Container */}
        <AthleteProfileContainer 
          athlete={athlete as any}
          results={latestByMetricId} 
          metrics={testMetrics}
          age={age} 
          pbs={pbs}
        />

        {/* Progress Chart */}
        <AthleteProgressChart 
          results={sortedResults.filter(r => (r.test_metrics as any)?.record_type === 'test') as any} 
          metrics={testMetrics}
        />

        {/* Hybrid Training & Test Log (Read Only) */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 font-semibold text-white">历史测试记录</h2>
          <AssessmentLogTable results={sortedResults} isEditable={false} />
        </div>

      </div>
    </div>
  )
}
