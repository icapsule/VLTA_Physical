'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import type { FitnessScore } from '@/lib/utils/fitness-score'

interface FitnessRadarChartProps {
  score: FitnessScore
}

export default function FitnessRadarChart({ score }: FitnessRadarChartProps) {
  // Convert dimensions to recharts format
  const data = Object.entries(score.dimensions).map(([, dim]) => ({
    subject: dim.label,
    A: dim.score,
    fullMark: 100,
  }))

  if (score.total === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
        <p className="text-sm text-gray-500">暂无测试数据无法生成雷达图</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        能力雷达图
      </h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
            <Radar
              name="能力评分"
              dataKey="A"
              stroke="#6366f1"
              fill="#8b5cf6"
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
              itemStyle={{ color: '#8b5cf6' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
