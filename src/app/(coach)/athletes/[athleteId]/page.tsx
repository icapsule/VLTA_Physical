import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateFitnessScore, SCORE_CONFIG } from '@/lib/utils/fitness-score'
import FitnessScoreCard from '@/components/features/fitness-score-card'
import type { TestResult, TestItem } from '@/lib/supabase/types'

interface AthleteDetailPageProps {
  params: Promise<{ athleteId: string }>
}

/**
 * Coach view of a single athlete — shows profile, fitness score, and full test history.
 */
export default async function AthleteDetailPage({ params }: AthleteDetailPageProps) {
  const { athleteId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: athlete }, { data: testResults }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', athleteId).eq('role', 'athlete').single(),
    supabase
      .from('test_results')
      .select('*, test_items(name, unit, higher_is_better)')
      .eq('athlete_id', athleteId)
      .order('test_date', { ascending: false }),
  ])

  if (!athlete) notFound()

  type TestResultWithItem = TestResult & { test_items: Pick<TestItem, 'name' | 'unit' | 'higher_is_better'> }

  const typedResults = (testResults ?? []) as TestResultWithItem[]

  // Build results map for scoring (latest per item)
  const latestByItemId: Record<number, number> = {}
  for (const r of typedResults) {
    if (latestByItemId[r.test_item_id] === undefined) {
      latestByItemId[r.test_item_id] = Number(r.result_value)
    }
  }

  const fitnessScore = calculateFitnessScore(latestByItemId)

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
          <h1 className="text-2xl font-bold text-white">{athlete.full_name}</h1>
          <p className="text-sm text-gray-400">
            {athlete.birth_date && `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁 · `}
            {athlete.height_cm && `身高 ${athlete.height_cm}cm · `}
            {athlete.weight_kg && `体重 ${athlete.weight_kg}kg`}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <a
            href={`/coach/athletes/${athleteId}/tests/new`}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + 录入成绩
          </a>
          <a
            href={`/coach/plans/new?athlete=${athleteId}`}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            + 创建计划
          </a>
        </div>
      </div>

      {/* Score + History */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <FitnessScoreCard score={fitnessScore} />
        </div>

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 font-semibold text-white">全部测试成绩</h2>
            {typedResults.length === 0 ? (
              <p className="text-sm text-gray-500">暂无测试记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-700 text-left text-xs text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">日期</th>
                      <th className="pb-2 pr-4">项目</th>
                      <th className="pb-2 pr-4">成绩</th>
                      <th className="pb-2">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typedResults.map((r) => (
                      <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 font-mono text-gray-400">{r.test_date}</td>
                        <td className="py-2 pr-4 text-gray-300">{r.test_items?.name}</td>
                        <td className="py-2 pr-4 font-mono font-semibold text-indigo-400">
                          {r.result_value} {r.test_items?.unit}
                        </td>
                        <td className="py-2 text-gray-500">{r.notes ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
