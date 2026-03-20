import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Athlete's training plans list page.
 */
export default async function PlansPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: assignments } = await supabase
    .from('plan_assignments')
    .select('*, training_plans(id, title, description, start_date, end_date, is_active), plan_progress(completed)')
    .eq('athlete_id', user.id)
    .order('assigned_at', { ascending: false })

  type Assignment = {
    id: number
    training_plans: {
      id: number
      title: string
      description: string | null
      start_date: string
      end_date: string
      is_active: boolean
    } | null
    plan_progress: { completed: boolean }[]
  }

  const typedAssignments = (assignments ?? []) as Assignment[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">我的训练计划</h1>

      {typedAssignments.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-gray-400">暂无分配的训练计划</p>
          <p className="mt-2 text-sm text-gray-500">教练分配计划后，将在此显示</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {typedAssignments.map((assignment) => {
            const plan = assignment.training_plans
            if (!plan) return null

            const start = new Date(plan.start_date)
            const end = new Date(plan.end_date)
            const totalDays =
              Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            const completed = assignment.plan_progress?.filter((p) => p.completed).length ?? 0
            const completionRate = totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0

            const isActive = plan.is_active && new Date() <= end

            return (
              <a
                key={assignment.id}
                href={`/plans/${assignment.id}`}
                className="block rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-indigo-700 hover:bg-gray-800"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h2 className="font-semibold text-white">{plan.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isActive
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isActive ? '进行中' : '已结束'}
                  </span>
                </div>

                {plan.description && (
                  <p className="mb-3 text-sm text-gray-400 line-clamp-2">{plan.description}</p>
                )}

                <p className="mb-4 text-xs text-gray-500">
                  {plan.start_date} → {plan.end_date}
                </p>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-400">
                    <span>完成进度</span>
                    <span>
                      {completed} / {totalDays} 天 ({completionRate}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
