import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TestTrendChart from '@/components/features/test-trend-chart'
import type { TestResult, TestItem } from '@/lib/supabase/types'

type TestResultWithItem = TestResult & { test_items: Pick<TestItem, 'name' | 'unit' | 'higher_is_better'> }

/**
 * Athlete test history page — grouped by test item, sorted by date descending.
 */
export default async function TestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: results } = await supabase
    .from('test_results')
    .select('*, test_items(name, unit, higher_is_better)')
    .eq('athlete_id', user.id)
    .order('test_date', { ascending: false })

  const typedResults = (results ?? []) as TestResultWithItem[]

  // Group by test item name
  const grouped: Record<string, TestResultWithItem[]> = {}
  for (const r of typedResults) {
    const name = r.test_items?.name ?? '未知项目'
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(r)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">我的体能成绩</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">暂无测试成绩记录</p>
          <p className="mt-2 text-sm text-gray-500">教练录入成绩后，将在此显示</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([itemName, itemResults]) => {
            const best = itemResults.reduce((prev, curr) =>
              itemResults[0]?.test_items?.higher_is_better
                ? (curr.result_value > prev.result_value ? curr : prev)
                : (curr.result_value < prev.result_value ? curr : prev)
            )

            return (
              <div key={itemName} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-white">{itemName}</h2>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">个人最佳</p>
                    <p className="font-mono text-lg font-bold text-yellow-400">
                      {best.result_value} {itemResults[0]?.test_items?.unit}
                    </p>
                  </div>
                </div>

                {itemResults.length > 1 && (
                  <div className="mb-6 rounded-xl bg-gray-950 p-4">
                    <TestTrendChart
                      results={itemResults}
                      higherIsBetter={itemResults[0]?.test_items?.higher_is_better ?? true}
                      unit={itemResults[0]?.test_items?.unit ?? ''}
                    />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left text-xs text-gray-500">
                        <th className="pb-2 pr-4">日期</th>
                        <th className="pb-2 pr-4">成绩</th>
                        <th className="pb-2">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemResults.map((r) => (
                        <tr key={r.id} className="border-b border-gray-800/50">
                          <td className="py-2 pr-4 font-mono text-gray-400">{r.test_date}</td>
                          <td className={`py-2 pr-4 font-mono font-semibold ${
                            r.id === best.id ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {r.result_value} {itemResults[0]?.test_items?.unit}
                            {r.id === best.id && <span className="ml-1 text-yellow-400">★</span>}
                          </td>
                          <td className="py-2 text-gray-500">{r.notes ?? '-'}</td>
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
