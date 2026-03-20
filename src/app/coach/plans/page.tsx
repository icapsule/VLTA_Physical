import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Coach's training plan management page.
 */
export default async function CoachPlansPage() {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: plans } = await supabase
    .from('training_plans')
    .select('*, plan_assignments(count)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">训练计划管理</h1>
        <a
          href="/coach/plans/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + 创建计划
        </a>
      </div>

      {(plans ?? []).length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          <p>暂无训练计划</p>
          <a
            href="/coach/plans/new"
            className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
          >
            创建你的第一个计划 →
          </a>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(plans ?? []).map((plan) => {
            const end = new Date(plan.end_date)
            const isActive = plan.is_active && new Date() <= end

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
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
                  <p className="mb-2 text-sm text-gray-400 line-clamp-2">{plan.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {plan.start_date} → {plan.end_date}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
