import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewPlanForm from '@/components/features/new-plan-form'

/**
 * Create new training plan page.
 */
export default async function NewPlanPage() {
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'athlete')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div>
        <a href="/coach/plans" className="text-sm text-indigo-400 hover:text-indigo-300">
          ← 返回计划列表
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">创建训练计划</h1>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <NewPlanForm
          athletes={athletes ?? []}
          coachId={user.id}
        />
      </div>
    </div>
  )
}
