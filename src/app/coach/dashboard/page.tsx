import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateFitnessScore } from '@/lib/utils/fitness-score'
import type { AthleteLatestResult } from '@/lib/supabase/types'

/**
 * Coach Dashboard — Server Component.
 * Shows all athletes with their latest results and composite fitness scores.
 */
export default async function CoachDashboardPage() {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  // Get all athletes
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, birth_date, height_cm, weight_kg')
    .eq('role', 'athlete')
    .order('full_name')

  // Get latest results for all athletes
  const { data: latestResults } = await supabase
    .from('athlete_latest_results')
    .select('*')

  const typedResults = (latestResults ?? []) as AthleteLatestResult[]

  // Group results by athlete
  const resultsByAthlete: Record<string, Record<number, number>> = {}
  for (const r of typedResults) {
    if (!resultsByAthlete[r.athlete_id]) resultsByAthlete[r.athlete_id] = {}
    // We don't have testItemId directly in the view, so skip scoring from view for now
    // Full scoring is done on the athlete detail page
  }

  // Get overall test counts per athlete
  const { data: testCounts } = await supabase
    .from('test_results')
    .select('athlete_id')

  const countByAthlete: Record<string, number> = {}
  for (const t of testCounts ?? []) {
    countByAthlete[t.athlete_id] = (countByAthlete[t.athlete_id] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">全队体能总览</h1>
          <p className="mt-1 text-sm text-gray-400">
            共 {athletes?.length ?? 0} 名运动员
          </p>
        </div>
        <a
          href="/coach/athletes"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          管理学员 →
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                运动员
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                测试记录数
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {(athletes ?? []).map((athlete, idx) => (
              <tr
                key={athlete.id}
                className={`border-b border-gray-800 transition-colors hover:bg-gray-800/50 ${
                  idx % 2 === 0 ? '' : 'bg-gray-900/50'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-sm">
                      {athlete.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={athlete.avatar_url}
                          alt={`${athlete.full_name}的头像`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{athlete.full_name}</p>
                      {athlete.birth_date && (
                        <p className="text-xs text-gray-500">
                          {new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono text-gray-300">
                    {countByAthlete[athlete.id] ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/coach/athletes/${athlete.id}`}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    查看详情 →
                  </a>
                </td>
              </tr>
            ))}
            {(athletes ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  暂无学员
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
