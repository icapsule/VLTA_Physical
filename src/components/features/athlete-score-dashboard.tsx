'use client'

import { useState } from 'react'
import { calculateFitnessScore, ScoringMode } from '@/lib/utils/fitness-score'
import FitnessRadarChart from './fitness-radar-chart'
import FitnessScoreCard from './fitness-score-card'

import type { TestItem, Gender } from '@/lib/supabase/types'

interface AthleteScoreDashboardProps {
  results: Record<string, number | boolean>
  metrics: TestItem[]
  age: number
  gender: Gender | null
  mode?: ScoringMode
  onModeChange?: (mode: ScoringMode) => void
}

export default function AthleteScoreDashboard({ results, metrics, age, gender, mode: controlledMode, onModeChange }: AthleteScoreDashboardProps) {
  const [localMode, setLocalMode] = useState<ScoringMode>('regular')
  
  const mode = controlledMode ?? localMode
  const handleModeChange = (newMode: ScoringMode) => {
    if (onModeChange) onModeChange(newMode)
    else setLocalMode(newMode)
  }

  const fitnessScore = calculateFitnessScore(results, metrics, age, gender, mode)

  return (
    <div className="space-y-6">
      {/* Score + Radar */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 h-full">
          <FitnessRadarChart score={fitnessScore} metrics={metrics} />
        </div>
        <div className="h-full">
          <FitnessScoreCard score={fitnessScore} />
        </div>
      </div>
    </div>
  )
}
