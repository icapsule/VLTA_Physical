import { createClient } from '@/lib/supabase/server'
import GroupSessionGrid from '@/components/features/group-session-grid'

export const dynamic = 'force-dynamic'

export default async function NewGroupSessionPage() {
  const supabase = await createClient()

  // 1. Fetch all athletes assigned to this coach (Wait, currently athletes are virtual and maybe we just fetch all profiles where role='athlete')
  // To be safe and broad for this MVP, fetch all athletes
  const { data: athletes, error: athletesError } = await supabase
    .from('profiles')
    .select('id, full_name, gender')
    .eq('role', 'athlete')
    .order('full_name', { ascending: true })

  // 2. Fetch all test metrics (Data Dictionary)
  const { data: metrics, error: metricsError } = await supabase
    .from('test_metrics')
    .select('*')
    .order('created_at', { ascending: true })

  if (athletesError || metricsError) {
    return (
      <div className="p-4 rounded-md bg-red-900/30 border border-red-800 text-red-400">
        Failed to load necessary data for Group Session Entry.
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">批量集训录入 (Group Session Entry)</h1>
        <p className="text-gray-400 text-sm mt-1">
          使用二维矩阵进行多学员、多项目的并发数据打卡。
        </p>
      </div>

      <GroupSessionGrid athletes={athletes || []} metrics={metrics || []} />
    </div>
  )
}
