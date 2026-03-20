import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateFitnessScore } from '@/lib/utils/fitness-score'
import FitnessScoreCard from '@/components/features/fitness-score-card'
import RecentTestsCard from '@/components/features/recent-tests-card'
import type { TestResult, Profile } from '@/lib/supabase/types'

/**
 * Athlete Dashboard — Server Component.
 * Shows fitness score, recent test results, and active training plan.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // Fetch recent test results (last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: testResults } = await supabase
    .from('test_results')
    .select('*, test_items(name, unit, higher_is_better)')
    .eq('athlete_id', user.id)
    .gte('test_date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('test_date', { ascending: false })

  // Fetch active plan assignment
  const { data: assignments } = await supabase
    .from('plan_assignments')
    .select('*, training_plans(title, start_date, end_date), plan_progress(completed)')
    .eq('athlete_id', user.id)
    .limit(1)

  // Build results map for scoring
  const latestByItem: Record<number, number> = {}
  for (const r of (testResults ?? []) as (TestResult & { test_items: { name: string; unit: string; higher_is_better: boolean } })[]) {
    if (latestByItem[r.test_item_id] === undefined) {
      latestByItem[r.test_item_id] = Number(r.result_value)
    }
  }

  const fitnessScore = calculateFitnessScore(latestByItem)

  const activeAssignment = assignments?.[0] as {
    id: number
    training_plans: { title: string; start_date: string; end_date: string } | null
    plan_progress: { completed: boolean }[]
  } | null

  // Calculate completion rate
  let completionRate = 0
  if (activeAssignment?.training_plans) {
    const plan = activeAssignment.training_plans
    const start = new Date(plan.start_date)
    const end = new Date(plan.end_date)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const completed = activeAssignment.plan_progress?.filter((p) => p.completed).length ?? 0
    completionRate = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
  }

  const recentTests = (testResults ?? []).slice(0, 5) as (TestResult & {
    test_items: { name: string; unit: string }
  })[]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          你好, {profile?.full_name ?? '运动员'} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">以下是你的体能概况</p>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Fitness Score Card */}
        <div className="md:col-span-1">
          <FitnessScoreCard score={fitnessScore} />
        </div>

        {/* Recent Tests */}
        <RecentTestsCard tests={recentTests} />

        {/* Active Plan */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            当前训练计划
          </h2>
          {!activeAssignment?.training_plans ? (
            <p className="text-sm text-gray-500">暂无分配的训练计划</p>
          ) : (
            <div>
              <p className="font-semibold text-white">
                {activeAssignment.training_plans.title}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {activeAssignment.training_plans.start_date} →{' '}
                {activeAssignment.training_plans.end_date}
              </p>
              {/* Completion progress bar */}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>完成进度</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <a
                href={`/plans/${activeAssignment.id}`}
                className="mt-4 block text-center text-xs text-indigo-400 hover:text-indigo-300"
              >
                查看详情 →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
