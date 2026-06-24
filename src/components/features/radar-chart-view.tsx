'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { FitnessScore } from '@/lib/utils/fitness-score'

interface RadarChartViewProps {
  score: FitnessScore
}

export default function RadarChartView({ score }: RadarChartViewProps) {
  const data = [
    { subject: score.dimensions.speed.label, A: score.dimensions.speed.score, fullMark: 100 },
    { subject: score.dimensions.power.label, A: score.dimensions.power.score, fullMark: 100 },
    { subject: score.dimensions.endurance.label, A: score.dimensions.endurance.score, fullMark: 100 },
    { subject: score.dimensions.flexibility.label, A: score.dimensions.flexibility.score, fullMark: 100 },
    { subject: score.dimensions.strength.label, A: score.dimensions.strength.score, fullMark: 100 },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400 self-start">
        多维体能分析 (雷达图)
      </h2>
      <div className="h-48 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} />
            <Radar
              name="得分"
              dataKey="A"
              stroke="#6366f1"
              strokeWidth={2}
              fill="#6366f1"
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
              itemStyle={{ color: '#E5E7EB' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center">
        <div className="text-3xl font-bold text-white">{score.total}</div>
        <div className="text-xs text-gray-500">综合得分</div>
      </div>
    </div>
  )
}
