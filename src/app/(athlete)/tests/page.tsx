import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TestTrendChart from '@/components/features/test-trend-chart'

type AssessmentResultWithItem = {
  id: string
  best_result: number
  is_passed: boolean | null
  test_metrics: {
    name_zh: string
    unit: string
    higher_is_better: boolean
    record_type: 'test' | 'training'
  }
  assessments: {
    test_date: string
  }
}

/**
 * Athlete test history page — grouped by test item, sorted by date descending.
 */
export default async function TestsPage() {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: results } = await supabase
    .from('assessment_results')
    .select(`
      id,
      best_result,
      is_passed,
      test_metrics!inner(name_zh, unit, higher_is_better, record_type),
      assessments!inner(test_date)
    `)
    .eq('athlete_id', user.id)

  // Sort by date descending
  const sortedResults = ((results as unknown) as AssessmentResultWithItem[] ?? []).sort((a, b) => {
    return b.assessments.test_date.localeCompare(a.assessments.test_date)
  })

  // Group by test item name
  const grouped: Record<string, AssessmentResultWithItem[]> = {}
  for (const r of sortedResults) {
    const name = r.test_metrics?.name_zh ?? '未知项目'
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(r)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">我的训练与测试日志</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">暂无测试成绩记录</p>
          <p className="mt-2 text-sm text-gray-500">教练录入成绩后，将在此显示</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([itemName, itemResults]) => {
            const isTraining = itemResults[0]?.test_metrics?.record_type === 'training'
            const isBoolean = itemResults[0]?.test_metrics?.unit === 'boolean'

            let best: AssessmentResultWithItem | null = null
            if (!isTraining && !isBoolean) {
              best = itemResults.reduce((prev, curr) =>
                itemResults[0]?.test_metrics?.higher_is_better
                  ? (curr.best_result > prev.best_result ? curr : prev)
                  : (curr.best_result < prev.best_result ? curr : prev)
              )
            }

            return (
              <div key={itemName} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    {itemName}
                    {isTraining ? (
                      <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-700/50">🏃 训练任务</span>
                    ) : (
                      <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-700/50">🏅 评估测试</span>
                    )}
                  </h2>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{isTraining ? '完成状态' : '个人最佳'}</p>
                    <p className="font-mono text-lg font-bold text-yellow-400">
                      {isTraining 
                        ? (itemResults[0].is_passed ? '✅ 已完成' : '❌ 未完成')
                        : `${best?.best_result ?? '-'} ${itemResults[0]?.test_metrics?.unit}`}
                    </p>
                  </div>
                </div>

                {!isTraining && itemResults.length > 1 && (
                  <div className="mb-6 rounded-xl bg-gray-950 p-4">
                    <TestTrendChart
                      // Note: TestTrendChart needs to be updated to match new structure or we map it
                      results={itemResults.map(r => ({
                        id: r.id,
                        test_date: r.assessments.test_date,
                        result_value: r.best_result,
                        notes: null
                      })) as any}
                      higherIsBetter={itemResults[0]?.test_metrics?.higher_is_better ?? true}
                      unit={itemResults[0]?.test_metrics?.unit ?? ''}
                    />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left text-xs text-gray-500">
                        <th className="pb-2 pr-4">日期</th>
                        <th className="pb-2 pr-4">{isTraining ? '完成状态' : '成绩'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemResults.map((r) => (
                        <tr key={r.id} className="border-b border-gray-800/50">
                          <td className="py-2 pr-4 font-mono text-gray-400">{r.assessments.test_date}</td>
                          <td className={`py-2 pr-4 font-mono font-semibold ${
                            best && r.id === best.id ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {isTraining 
                              ? (r.is_passed ? <span className="text-emerald-400">✅ 已完成</span> : <span className="text-red-400">❌ 未完成</span>)
                              : `${r.best_result} ${itemResults[0]?.test_metrics?.unit}`}
                            {best && r.id === best.id && <span className="ml-1 text-yellow-400">★</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
