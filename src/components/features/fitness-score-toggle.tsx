'use client'

import { useState } from 'react'
import type { FitnessScore } from '@/lib/utils/fitness-score'
import FitnessScoreCard from './fitness-score-card'
import RadarChartView from './radar-chart-view'

interface FitnessScoreToggleProps {
  score: FitnessScore
}

export default function FitnessScoreToggle({ score }: FitnessScoreToggleProps) {
  const [viewType, setViewType] = useState<'radar' | 'card'>('radar')

  return (
    <div className="relative h-full">
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={() => setViewType(viewType === 'radar' ? 'card' : 'radar')}
          className="rounded-lg bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
        >
          {viewType === 'radar' ? '切换至简版' : '切换至雷达图'}
        </button>
      </div>
      
      {viewType === 'radar' ? (
        <RadarChartView score={score} />
      ) : (
        <FitnessScoreCard score={score} />
      )}
    </div>
  )
}
