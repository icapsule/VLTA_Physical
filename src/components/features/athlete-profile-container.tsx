'use client'

import { useState } from 'react'
import type { Profile, TestItem } from '@/lib/supabase/types'
import { ScoringMode } from '@/lib/utils/fitness-score'
import AthleteScoreDashboard from './athlete-score-dashboard'
import AthletePBDashboard from './athlete-pb-dashboard'

interface Props {
  athlete: Profile
  results: Record<string, number | boolean>
  metrics: TestItem[]
  age: number
  pbs: Record<string, { value: number; date: string } | null>
}

export default function AthleteProfileContainer({ athlete, results, metrics, age, pbs }: Props) {
  const [mode, setMode] = useState<ScoringMode>('regular')

  return (
    <div className="space-y-6">
      {/* Hero & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-2xl">
            {athlete.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={athlete.avatar_url} alt={`${athlete.full_name}的头像`} className="h-full w-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {athlete.full_name}
              {athlete.gender === 'male' && <span className="text-blue-400 text-lg">♂</span>}
              {athlete.gender === 'female' && <span className="text-pink-400 text-lg">♀</span>}
            </h1>
            <p className="text-sm text-gray-400">
              {athlete.birth_date && `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁 · `}
              {athlete.height_cm && `身高 ${athlete.height_cm}cm · `}
              {athlete.weight_kg && `体重 ${athlete.weight_kg}kg`}
            </p>
          </div>
        </div>

        {/* Scoring Mode Toggle */}
        <div className="inline-flex rounded-lg border border-gray-800 bg-gray-950 p-1">
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

      {/* Score + Radar Dashboard */}
      <AthleteScoreDashboard 
        results={results} 
        metrics={metrics}
        age={age} 
        gender={athlete.gender}
        mode={mode}
        onModeChange={setMode}
      />

      {/* PB Dashboard */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 font-semibold text-white">🏆 个人最高纪录 (PB)</h2>
        <AthletePBDashboard 
          athlete={athlete} 
          metrics={metrics} 
          pbs={pbs} 
          mode={mode}
          age={age}
        />
      </div>
    </div>
  )
}
