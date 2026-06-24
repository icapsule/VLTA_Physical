import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TestItem, Profile } from '@/lib/supabase/types'
import AthleteScoreDashboard from '@/components/features/athlete-score-dashboard'
import AthleteProgressChart from '@/components/features/athlete-progress-chart'
import AthletePBDashboard from '@/components/features/athlete-pb-dashboard'

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
      <div className="flex items-center gap-4">
        <a href="/coach/athletes" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← 返回学员列表
        </a>
      </div>

      {/* Hero */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-2xl">
          {athlete.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={athlete.avatar_url} alt={`${athlete.full_name}的头像`} className="h-full w-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {athlete.full_name}
            {athlete.gender === 'male' && <span className="text-blue-400 text-lg">♂</span>}
            {athlete.gender === 'female' && <span className="text-pink-400 text-lg">♀</span>}
          </h1>
          <p className="text-sm text-gray-400">
            {athlete.birth_date && `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁 · `}
            {athlete.height_cm && `身高 ${athlete.height_cm}cm · `}
            {athlete.weight_kg && `体重 ${athlete.weight_kg}kg`}
          </p>
        </div>
      </div>

      {/* Score + Radar Dashboard */}
      <AthleteScoreDashboard results={latestByMetricId} age={age} />

      {/* PB Dashboard */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 font-semibold text-white">🏆 个人最高纪录 (PB)</h2>
        <AthletePBDashboard athlete={athlete as any} metrics={testMetrics} pbs={pbs} />
      </div>

      {/* Progress Chart (Only shows 'test' records) */}
      <AthleteProgressChart results={sortedResults.filter(r => (r.test_metrics as any)?.record_type === 'test') as any} />

      {/* Hybrid Training & Test Log */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 font-semibold text-white">训练与测试日志</h2>
        {sortedResults.length === 0 ? (
          <p className="text-sm text-gray-500">暂无测试记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700 text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-2 pr-4">日期</th>
                  <th className="pb-2 pr-4">项目</th>
                  <th className="pb-2 pr-4">最好成绩</th>
                  <th className="pb-2 pr-4">完成状态</th>
                  <th className="pb-2">所有尝试</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 pr-4 font-mono text-gray-400">{(r.assessments as any)?.test_date}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{(r.test_metrics as any)?.name_zh}</span>
                        {(r.test_metrics as any)?.record_type === 'test' ? (
                          <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-700/50">🏅 评估测试</span>
                        ) : (
                          <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-700/50">🏃 训练任务</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-indigo-400">
                      {(r.test_metrics as any)?.record_type === 'test' ? `${r.best_result} ${(r.test_metrics as any)?.unit}` : '-'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm">
                      {(r.test_metrics as any)?.record_type === 'training' 
                        ? (r.is_passed ? <span className="text-emerald-400">✅ 已完成</span> : <span className="text-red-400">❌ 未完成</span>)
                        : <span className="text-gray-600">-</span>
                      }
                    </td>
                    <td className="py-3 font-mono text-gray-500">
                      {(r.test_metrics as any)?.record_type === 'test' && r.attempts && Array.isArray(r.attempts) ? r.attempts.join(' / ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
