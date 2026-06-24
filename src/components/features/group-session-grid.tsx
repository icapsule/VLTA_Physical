'use client'

import { useState } from 'react'
import type { TestItem, Profile } from '@/lib/supabase/types'
import { submitGroupSession } from '@/lib/actions/group-session-action'
import { useRouter } from 'next/navigation'

interface Props {
  athletes: Pick<Profile, 'id' | 'full_name' | 'gender'>[]
  metrics: TestItem[]
}

export default function GroupSessionGrid({ athletes, metrics }: Props) {
  const router = useRouter()
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set())
  const [selectedMetricIds, setSelectedMetricIds] = useState<Set<string>>(new Set())
  
  // Grid state: Record<athleteId, Record<metricId, string | boolean>>
  const [gridData, setGridData] = useState<Record<string, Record<string, string | boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers for Step 1 Configuration
  const toggleAthlete = (id: string) => {
    const next = new Set(selectedAthleteIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAthleteIds(next)
  }

  const toggleMetric = (id: string) => {
    const next = new Set(selectedMetricIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedMetricIds(next)
  }

  // Handlers for Data Grid
  const updateGridValue = (athleteId: string, metricId: string, value: string | boolean) => {
    setGridData(prev => ({
      ...prev,
      [athleteId]: {
        ...(prev[athleteId] || {}),
        [metricId]: value
      }
    }))
  }

  const markAllPassedForMetric = (metricId: string) => {
    setGridData(prev => {
      const next = { ...prev }
      selectedAthleteIds.forEach(aId => {
        if (!next[aId]) next[aId] = {}
        next[aId][metricId] = true
      })
      return next
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    // Flatten gridData into payload
    const payloadResults: { athleteId: string, metricId: string, value: string | boolean }[] = []
    
    selectedAthleteIds.forEach(aId => {
      selectedMetricIds.forEach(mId => {
        const val = gridData[aId]?.[mId]
        if (val !== undefined && val !== '') {
          payloadResults.push({
            athleteId: aId,
            metricId: mId,
            value: val
          })
        }
      })
    })

    if (payloadResults.length === 0) {
      setError('Please fill in at least one result before submitting.')
      setIsSubmitting(false)
      return
    }

    const res = await submitGroupSession({ testDate, results: payloadResults })
    
    if (res.success) {
      alert('Group Session logged successfully! 🎉')
      router.push('/coach/athletes')
    } else {
      setError(res.error || 'Failed to submit.')
      setIsSubmitting(false)
    }
  }

  // Derived arrays for rendering
  const activeAthletes = athletes.filter(a => selectedAthleteIds.has(a.id))
  const activeMetrics = metrics.filter(m => selectedMetricIds.has(m.id))

  return (
    <div className="space-y-8">
      {/* STEP 1: Configuration */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Step 1: 圈定训练范围 (Session Configuration)</h2>
          <p className="text-sm text-gray-400">选择日期，并圈选出今天到场的学员以及他们练了什么项目。</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">训练日期 (Date)</label>
            <input 
              type="date" 
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Athletes Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">到场学员 (Athletes)</label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-800 bg-gray-950 p-3 space-y-2">
              {athletes.map(a => (
                <label key={a.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={selectedAthleteIds.has(a.id)}
                    onChange={() => toggleAthlete(a.id)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-500"
                  />
                  <span className="text-sm text-white">{a.full_name}</span>
                  {a.gender === 'female' ? <span className="text-xs text-pink-400">♀</span> : <span className="text-xs text-blue-400">♂</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Metrics Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">训练项目 (Metrics & Tests)</label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-gray-800 bg-gray-950 p-3 space-y-2">
              {metrics.map(m => (
                <label key={m.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={selectedMetricIds.has(m.id)}
                    onChange={() => toggleMetric(m.id)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500"
                  />
                  <span className="text-sm text-white">{m.name_zh}</span>
                  {m.record_type === 'test' 
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/30 text-indigo-300">🏅 测试</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300">🏃 训练</span>
                  }
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: The Matrix DataGrid */}
      {selectedAthleteIds.size > 0 && selectedMetricIds.size > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Step 2: 矩阵录入 (DataGrid Input)</h2>
              <p className="text-sm text-gray-400">使用键盘 Tab 键极速跳转录入，或使用表头按钮一键通过。</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/80 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300 border-r border-gray-800 bg-gray-900">
                    学员 \\ 项目
                  </th>
                  {activeMetrics.map(m => (
                    <th key={m.id} className="px-4 py-3 text-left font-semibold text-gray-300 border-r border-gray-800 min-w-[140px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-white">{m.name_zh}</span>
                        {m.unit === 'boolean' ? (
                          <button 
                            onClick={() => markAllPassedForMetric(m.id)}
                            className="text-[10px] bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 rounded py-0.5 px-2 hover:bg-emerald-800 transition-colors"
                          >
                            ⚡️ 一键全员通过
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500">单位: {m.unit}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {activeAthletes.map(athlete => (
                  <tr key={athlete.id} className="hover:bg-gray-900/30">
                    <td className="px-4 py-3 font-medium text-gray-200 border-r border-gray-800 whitespace-nowrap bg-gray-900/20">
                      {athlete.full_name}
                    </td>
                    {activeMetrics.map(m => {
                      const val = gridData[athlete.id]?.[m.id]
                      
                      return (
                        <td key={m.id} className="px-4 py-2 border-r border-gray-800">
                          {m.unit === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer h-full py-1">
                              <input 
                                type="checkbox"
                                checked={val === true}
                                onChange={(e) => updateGridValue(athlete.id, m.id, e.target.checked)}
                                className="h-5 w-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                              />
                              <span className={val ? "text-emerald-400 font-medium" : "text-gray-600"}>
                                {val ? '✅ 已完成' : '待完成'}
                              </span>
                            </label>
                          ) : (
                            <input 
                              type="number"
                              step="0.01"
                              value={val === undefined || typeof val === 'boolean' ? '' : val}
                              onChange={(e) => updateGridValue(athlete.id, m.id, e.target.value)}
                              placeholder={`输入${m.unit}`}
                              className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-1.5 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="rounded border border-red-900/50 bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? '正在写入矩阵并发...' : '🚀 并发提交 (Submit Matrix)'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
