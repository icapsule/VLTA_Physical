import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanCheckIn from '@/components/features/plan-check-in'
import type { PlanDetails } from '@/lib/supabase/types'

interface PlanDetailPageProps {
  params: Promise<{ planId: string }>
}

/**
 * Plan detail page — shows today's training content and daily check-in.
 */
export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  type AssignmentRow = {
    id: number
    training_plans: {
      id: number
      title: string
      description: string | null
      start_date: string
      end_date: string
      plan_details: PlanDetails
    } | null
    plan_progress: { progress_date: string; completed: boolean }[]
  }

  const { data: assignmentData } = await supabase
    .from('plan_assignments')
    .select('*, training_plans(*), plan_progress(*)')
    .eq('id', Number(planId))
    .eq('athlete_id', user.id)
    .single()

  const assignment = assignmentData as AssignmentRow | null

  if (!assignment?.training_plans) notFound()

  const plan = assignment.training_plans as {
    id: number
    title: string
    description: string | null
    start_date: string
    end_date: string
    plan_details: PlanDetails
  }

  const today = new Date().toISOString().split('T')[0]
  const todayProgress = (assignment.plan_progress ?? []).find(
    (p: { progress_date: string; completed: boolean }) => p.progress_date === today
  )

  // Calculate which "day number" today is in the plan
  const planStart = new Date(plan.start_date)
  const todayDate = new Date(today)
  const dayIndex = Math.floor(
    (todayDate.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const todayPlanDay = plan.plan_details?.days?.find((d) => d.day === dayIndex + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a href="/plans" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← 返回计划列表
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">{plan.title}</h1>
        {plan.description && (
          <p className="mt-1 text-sm text-gray-400">{plan.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {plan.start_date} → {plan.end_date}
        </p>
      </div>

      {/* Today's Training */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">
            今日训练 — {todayPlanDay?.label ?? `第${dayIndex + 1}天`}
          </h2>
          <PlanCheckIn
            assignmentId={Number(planId)}
            date={today}
            completed={todayProgress?.completed ?? false}
          />
        </div>

        {todayPlanDay?.exercises && todayPlanDay.exercises.length > 0 ? (
          <ul className="space-y-3">
            {todayPlanDay.exercises.map((ex, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{ex.name}</p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {ex.sets} 组 ×{' '}
                    {ex.reps !== undefined
                      ? `${ex.reps} 次`
                      : `${ex.duration_sec} 秒`}
                    {ex.notes && ` — ${ex.notes}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-gray-500">
            {dayIndex < 0
              ? '计划尚未开始'
              : dayIndex >= (plan.plan_details?.days?.length ?? 0)
              ? '计划已结束，感谢坚持！🎉'
              : '今日暂无安排的训练内容'}
          </p>
        )}
      </div>
    </div>
  )
}
