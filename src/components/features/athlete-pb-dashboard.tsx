'use client'

import { useState } from 'react'
import type { Profile, TestItem } from '@/lib/supabase/types'
import { DIMENSION_LABELS, getScoreConfig, ScoringMode, calculateItemScore } from '@/lib/utils/fitness-score'
import { submitGroupSession } from '@/lib/actions/group-session-action'
import { displayMetricValue, parseTimeStringToSeconds } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

interface Props {
  athlete: Profile
  metrics: TestItem[]
  pbs: Record<string, { value: number; date: string } | null>
  mode?: ScoringMode
  age?: number
}

export default function AthletePBDashboard({ athlete, metrics, pbs, mode = 'regular', age = 10 }: Props) {
  const router = useRouter()
  const [editingMetric, setEditingMetric] = useState<TestItem | null>(null)
  const [newValue, setNewValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenModal = (m: TestItem) => {
    setEditingMetric(m)
    setNewValue('')
    setError(null)
  }

  const handleSubmitPB = async () => {
    if (!editingMetric || !newValue) return

    setIsSubmitting(true)
    setError(null)

    // Using today's date for manual PB overrides
    const today = new Date().toISOString().split('T')[0]

    let finalValue = newValue
    if (editingMetric.unit === 's') {
      const parsed = parseTimeStringToSeconds(newValue)
      if (!isNaN(parsed)) {
        finalValue = parsed.toString()
      } else {
        setError('无效的时间格式')
        setIsSubmitting(false)
        return
      }
    }

    const res = await submitGroupSession({
      testDate: today,
      results: [
        {
          athleteId: athlete.id,
          metricId: editingMetric.id,
          value: finalValue
        }
      ]
    })

    if (res.success) {
      setEditingMetric(null)
      router.refresh() // Refresh Server Component to recalculate PB
    } else {
      setError(res.error || 'Failed to update PB.')
    }
    
    setIsSubmitting(false)
  }

  const scoreConfigs = getScoreConfig(age, athlete.gender, mode, metrics)

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m) => {
          const pb = pbs[m.id]
          const label = DIMENSION_LABELS[m.dimension as keyof typeof DIMENSION_LABELS] || m.dimension
          const config = scoreConfigs.find(c => c.metricId === m.id)
          
          let pbScore = 0
          if (pb && config && typeof pb.value === 'number') {
            pbScore = calculateItemScore(pb.value, config)
          } else if (pb && typeof pb.value === 'boolean') {
            pbScore = pb.value ? 100 : 0
          }

          return (
            <div key={m.id} className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-5 group transition-all hover:border-yellow-700/50">
              {/* Background Glow */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-600/10 blur-2xl transition-opacity group-hover:bg-yellow-500/20" />
              
              <div className="flex flex-col h-full justify-between gap-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <h3 className="text-sm font-semibold text-white mt-1">{m.name_zh}</h3>
                  </div>
                  
                  {/* Compact PB Display in the top right corner */}
                  <div className="flex flex-col items-end text-right">
                    {pb !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-yellow-500 tracking-tight">{displayMetricValue(pb.value, m.unit)}</span>
                          <span className="text-[10px] font-medium text-gray-500">{m.unit}</span>
                        </div>
                        <span className="text-[9px] text-gray-600 font-medium">{pb.date}</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-gray-700 italic mt-1">No Record</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                      {/* Empty space since PB moved to top right */}
                    </div>
                    
                    <button 
                      onClick={() => handleOpenModal(m)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      🔥 刷新
                    </button>
                  </div>
                  
                  {/* Position Progress Bar */}
                  {pb !== null && config && m.unit !== 'boolean' && (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                        <span>0分</span>
                        <span className="text-indigo-400">当前得分: {pbScore} 分</span>
                        <span>100分 ({displayMetricValue(config.max, m.unit)})</span>
                      </div>
                      <div className="relative h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        {/* 60 Points (Pass) Marker */}
                        <div className="absolute top-0 bottom-0 left-[60%] w-[1px] bg-gray-500 z-10"></div>
                        
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative z-0 ${
                            pbScore >= 60 
                              ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' 
                              : 'bg-gradient-to-r from-red-900 to-red-500'
                          }`}
                          style={{ width: `${pbScore}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-gray-600">
                        <span className="ml-[60%] -translate-x-1/2">及格线 ({displayMetricValue(config.min, m.unit)})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">🔥 刷新 PB (Record New Best)</h3>
            <p className="text-sm text-gray-400 mb-6">
              录入 <span className="text-yellow-400 font-semibold">{athlete.full_name}</span> 在 <span className="text-indigo-400 font-semibold">{editingMetric.name_zh}</span> 的最新成绩。系统会自动将它结算为最新 PB。
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">成绩数值 ({editingMetric.unit})</label>
                <input
                  type={editingMetric.unit === 's' ? 'text' : 'number'}
                  step={editingMetric.unit === 's' ? undefined : '0.01'}
                  autoFocus
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={editingMetric.unit === 's' ? '如 4:22.96' : `输入${editingMetric.unit}`}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                />
                {editingMetric.higher_is_better ? (
                  <p className="text-[10px] text-green-400 mt-1">此项目数值必须高于当前 PB 才能生效。</p>
                ) : (
                  <p className="text-[10px] text-blue-400 mt-1">此项目数值必须低于当前 PB 才能生效。</p>
                )}
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingMetric(null)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitPB}
                  disabled={isSubmitting || !newValue}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? '正在入库...' : '确认刷新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
