'use client'

import { useState } from 'react'
import { calculateFitnessScore, ScoringMode } from '@/lib/utils/fitness-score'
import FitnessRadarChart from './fitness-radar-chart'
import FitnessScoreCard from './fitness-score-card'

interface AthleteScoreDashboardProps {
  results: Record<string, number | boolean>
  age: number
}

export default function AthleteScoreDashboard({ results, age }: AthleteScoreDashboardProps) {
  const [mode, setMode] = useState<ScoringMode>('regular')

  const fitnessScore = calculateFitnessScore(results, age, mode)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-800 bg-gray-900 p-1">
          <button
            onClick={() => setMode('regular')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'regular'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            普通青少年标准
          </button>
          <button
            onClick={() => setMode('elite')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'elite'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            精英运动员标准
          </button>
        </div>
      </div>

      {/* Score + Radar */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FitnessRadarChart score={fitnessScore} />
        </div>
        <div>
          <FitnessScoreCard score={fitnessScore} />
        </div>
      </div>
    </div>
  )
}
