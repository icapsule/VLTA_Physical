'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PlanCheckInProps {
  assignmentId: number
  date: string
  completed: boolean
}

/**
 * PlanCheckIn — client component for toggling daily training completion.
 */
export default function PlanCheckIn({ assignmentId, date, completed: initialCompleted }: PlanCheckInProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCheckIn = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: upsertError } = await supabase
        .from('plan_progress')
        .upsert(
          {
            assignment_id: assignmentId,
            progress_date: date,
            completed: !completed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'assignment_id,progress_date' }
        )

      if (upsertError) throw upsertError
      setCompleted((prev) => !prev)
    } catch (err) {
      const e = err as { message: string }
      setError(e.message ?? '操作失败')
    } finally {
      setLoading(false)
    }
  }, [assignmentId, date, completed])

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggleCheckIn}
        disabled={loading}
        aria-label={completed ? '取消今日打卡' : '标记今日完成'}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          completed
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {loading ? '...' : completed ? '✅ 已完成' : '打卡完成'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

PlanCheckIn.displayName = 'PlanCheckIn'
