import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PlanProgress } from '@/lib/supabase/types'

/**
 * Coach Plan Detail Page
 * Allows coach to view a training plan details and see the completion rates of assigned athletes.
 */
export default async function CoachPlanDetailPage({ params }: { params: { planId: string } }) {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch plan details
  const { data: planData } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', Number(params.planId))
    .single()

  if (!planData) notFound()

  // Fetch assigned athletes and their progress
  const { data: assignmentsData } = await supabase
    .from('plan_assignments')
    .select('id, athlete_id, profiles!inner(full_name, avatar_url), plan_progress(*)')
    .eq('plan_id', planData.id)

  const assignments = (assignmentsData ?? []) as ({
    id: number
    athlete_id: string
    profiles: { full_name: string; avatar_url: string | null }
    plan_progress: Extract<PlanProgress, 'completed'>[]
  } | any)[] // `any` type assertion hack to bypass supabase generic mismatch for inner join
  
  const start = new Date(planData.start_date)
  const end = new Date(planData.end_date)
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a href="/coach/plans" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← 返回计划列表
          </a>
          <h1 className="mt-2 text-2xl font-bold text-white">{planData.title}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {planData.start_date} 至 {planData.end_date} •{' '}
            {planData.is_active ? (
              <span className="text-green-400 font-medium">执行中</span>
            ) : (
              <span className="text-gray-500">已停用</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan Content */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-white">计划详情描述</h2>
          <div className="prose prose-invert max-w-none text-sm text-gray-300">
            {planData.description ? (
              <p className="whitespace-pre-wrap">{planData.description}</p>
            ) : (
              <p className="text-gray-500 italic">暂无描述</p>
            )}
          </div>

          <h3 className="mt-8 mb-4 text-md font-semibold text-white">结构详情 (JSON)</h3>
          <div className="rounded-lg bg-gray-950 p-4 font-mono text-xs text-indigo-300 overflow-x-auto">
            <pre>{JSON.stringify(planData.plan_details, null, 2)}</pre>
          </div>
        </div>

        {/* Assigned Athletes Progress */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-white">学员完成统计</h2>
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-500">此计划尚未分配给任何学员</p>
            ) : (
              assignments.map((assignment) => {
                const completedCount = assignment.plan_progress?.filter((p: any) => p.completed).length ?? 0
                const completionRate = Math.round((completedCount / totalDays) * 100)

                return (
                  <div key={assignment.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-xs">
                          {assignment.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={assignment.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {assignment.profiles?.full_name ?? '未知学员'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {completedCount} / {totalDays} 天 ({completionRate}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={`h-full transition-all ${
                          completionRate >= 80
                            ? 'bg-green-500'
                            : completionRate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, completionRate)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
