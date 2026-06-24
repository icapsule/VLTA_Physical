'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type ResultItem = {
  id: number
  metric_id: string
  best_result: number | null
  is_passed: boolean | null
  test_metrics: {
    name_zh: string
    unit: string
    higher_is_better: boolean
  } | null
  assessments: {
    test_date: string
  } | null
}

interface AthleteProgressChartProps {
  results: ResultItem[]
}

export default function AthleteProgressChart({ results }: AthleteProgressChartProps) {
  // Extract unique metrics from historical results
  const uniqueMetrics = useMemo(() => {
    const map = new Map<string, { id: string; name: string; unit: string; higherIsBetter: boolean }>()
    results.forEach(r => {
      if (!map.has(r.metric_id) && r.test_metrics) {
        map.set(r.metric_id, {
          id: r.metric_id,
          name: r.test_metrics.name_zh,
          unit: r.test_metrics.unit,
          higherIsBetter: r.test_metrics.higher_is_better,
        })
      }
    })
    return Array.from(map.values())
  }, [results])

  const [selectedMetricId, setSelectedMetricId] = useState<string>(uniqueMetrics[0]?.id || '')

  // Prepare chart data: sorted chronologically
  const chartData = useMemo(() => {
    if (!selectedMetricId) return []
    
    const filtered = results
      .filter(r => r.metric_id === selectedMetricId)
      .sort((a, b) => {
        const dateA = a.assessments?.test_date || '1900-01-01'
        const dateB = b.assessments?.test_date || '1900-01-01'
        return dateA.localeCompare(dateB)
      })

    return filtered.map(r => ({
      date: r.assessments?.test_date,
      value: Number(r.best_result),
      raw: r
    }))
  }, [results, selectedMetricId])

  const selectedMetricInfo = uniqueMetrics.find(m => m.id === selectedMetricId)

  if (uniqueMetrics.length === 0) {
    return null
  }

  // Ensure default state matches if uniqueMetrics loads asynchronously
  if (!selectedMetricId && uniqueMetrics.length > 0) {
    setSelectedMetricId(uniqueMetrics[0].id)
  }

  // Determine if Y-axis should be reversed (so that going UP means getting better)
  const reverseYAxis = !selectedMetricInfo?.higherIsBetter

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-white">能力成长曲线</h2>
        <select
          value={selectedMetricId}
          onChange={(e) => setSelectedMetricId(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          {uniqueMetrics.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              tickMargin={10} 
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              domain={['auto', 'auto']}
              reversed={reverseYAxis}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '0.75rem' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '0.25rem' }}
              formatter={(value: any) => {
                return [`${value} ${selectedMetricInfo?.unit}`, '最好成绩']
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#1f2937' }}
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
