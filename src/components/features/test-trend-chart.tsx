'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import type { TestResult } from '@/lib/supabase/types'

type ChartDataPoint = {
  date: string
  value: number
  isBest: boolean
}

interface TestTrendChartProps {
  results: TestResult[]
  higherIsBetter: boolean
  unit: string
}

/**
 * Recharts component to display trend over time for a specific test item.
 */
export default function TestTrendChart({ results, higherIsBetter, unit }: TestTrendChartProps) {
  const chartData = useMemo(() => {
    if (results.length === 0) return []

    // Sort by date ascending for line chart
    const sorted = [...results].sort(
      (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
    )

    let bestValue = sorted[0].result_value
    for (const r of sorted) {
      if (higherIsBetter) {
        if (r.result_value > bestValue) bestValue = r.result_value
      } else {
        if (r.result_value < bestValue) bestValue = r.result_value
      }
    }

    return sorted.map((r) => ({
      date: new Date(r.test_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      value: Number(r.result_value),
      isBest: r.result_value === bestValue,
      originalDate: r.test_date,
    }))
  }, [results, higherIsBetter])

  const bestPoints = chartData.filter((d) => d.isBest)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#818CF8' }}
            formatter={(value: any) => [`${value} ${unit}`, '成绩']}
            labelStyle={{ color: '#D1D5DB' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#1F2937', stroke: '#6366F1', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#818CF8', stroke: '#312E81', strokeWidth: 2 }}
          />
          {bestPoints.map((point, idx) => (
            <ReferenceDot
              key={`best-${idx}`}
              x={point.date}
              y={point.value}
              r={6}
              fill="#FBBF24"
              stroke="#B45309"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
