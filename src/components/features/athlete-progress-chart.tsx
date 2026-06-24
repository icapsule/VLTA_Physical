'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { displayMetricValue } from '@/lib/utils/format'
import type { TestItem } from '@/lib/supabase/types'
import { DIMENSION_LABELS, FitnessScore } from '@/lib/utils/fitness-score'

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
  metrics: TestItem[]
}

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as Array<keyof FitnessScore['dimensions']>

export default function AthleteProgressChart({ results, metrics }: AthleteProgressChartProps) {
  const [selectedDimension, setSelectedDimension] = useState<keyof FitnessScore['dimensions']>('speed')
  const [selectedMetricId, setSelectedMetricId] = useState<string>('')

  // Metrics belonging to selected dimension
  const dimensionMetrics = useMemo(() => {
    return metrics.filter(m => m.dimension === selectedDimension && m.record_type === 'test')
  }, [metrics, selectedDimension])

  // Automatically select the first metric when dimension changes
  useEffect(() => {
    if (dimensionMetrics.length > 0 && !dimensionMetrics.some(m => m.id === selectedMetricId)) {
      setSelectedMetricId(dimensionMetrics[0].id)
    }
  }, [dimensionMetrics, selectedMetricId])

  // Prepare chart data: sorted chronologically
  const chartData = useMemo(() => {
    if (!selectedMetricId) return []
    
    const filtered = results
      .filter(r => r.metric_id === selectedMetricId)
      .sort((a, b) => {
        // @ts-ignore
        const dateA = a.assessments?.test_date || '1900-01-01'
        // @ts-ignore
        const dateB = b.assessments?.test_date || '1900-01-01'
        return dateA.localeCompare(dateB)
      })

    return filtered.map(r => ({
      // @ts-ignore
      date: r.assessments?.test_date,
      value: Number(r.best_result),
      raw: r
    }))
  }, [results, selectedMetricId])

  const selectedMetricInfo = metrics.find(m => m.id === selectedMetricId)

  if (metrics.length === 0) {
    return null
  }

  // Determine if Y-axis should be reversed
  const reverseYAxis = !selectedMetricInfo?.higher_is_better

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-xl shadow-black/20">
      <div className="p-6 border-b border-gray-800/60 bg-gray-900/50">
        <h2 className="font-semibold text-white mb-4">能力成长曲线</h2>
        
        {/* Tier 1: Dimensions Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DIMENSION_KEYS.map(dim => {
            const isActive = selectedDimension === dim
            return (
              <button
                key={dim}
                onClick={() => setSelectedDimension(dim)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-300'
                }`}
              >
                {DIMENSION_LABELS[dim]}
              </button>
            )
          })}
        </div>

        {/* Tier 2: Metrics Navigation */}
        {dimensionMetrics.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800/50">
            {dimensionMetrics.map(m => {
              const isActive = selectedMetricId === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetricId(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gray-700 text-white border border-gray-500 shadow-sm'
                      : 'bg-gray-900 text-gray-500 border border-gray-800 hover:bg-gray-800 hover:text-gray-400'
                  }`}
                >
                  {m.name_zh}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-6 h-72 w-full bg-gray-950/30">
        {chartData.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 space-y-2">
            <span className="text-3xl opacity-50">📭</span>
            <p className="text-sm">暂未解锁该项测试数据</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                tick={{ fill: '#9ca3af', fontSize: 11 }} 
                tickMargin={12} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fill: '#9ca3af', fontSize: 11 }} 
                domain={['auto', 'auto']}
                reversed={reverseYAxis}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => selectedMetricInfo ? displayMetricValue(value, selectedMetricInfo.unit) : value}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(8px)', borderColor: '#374151', color: '#fff', borderRadius: '0.75rem', padding: '12px' }}
                itemStyle={{ color: '#818cf8', fontWeight: 600 }}
                labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '12px' }}
                cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '4 4' }}
                formatter={(value: any) => {
                  const displayVal = selectedMetricInfo ? displayMetricValue(value, selectedMetricInfo.unit) : value
                  return [`${displayVal} ${selectedMetricInfo?.unit}`, '🏆 最好成绩']
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#1f2937', strokeWidth: 2, r: 4, stroke: '#6366f1' }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
