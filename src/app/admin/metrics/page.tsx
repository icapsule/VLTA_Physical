import { createClient } from '@/lib/supabase/server'
import type { TestItem } from '@/lib/supabase/types'
import AdminMetricsClient from './client-page'

export const dynamic = 'force-dynamic'

export default async function AdminMetricsPage() {
  const supabase = await createClient()

  // Fetch all metrics directly from the DB
  const { data: metrics, error } = await supabase
    .from('test_metrics')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-400">
        加载字典失败：{error.message}
      </div>
    )
  }

  const typedMetrics = (metrics ?? []) as TestItem[]

  return <AdminMetricsClient initialMetrics={typedMetrics} />
}
