'use client'

import { useCallback } from 'react'
import type { FitnessScore } from '@/lib/utils/fitness-score'
import { DIMENSION_LABELS_EN } from '@/lib/utils/fitness-score'
import { useT, useLocale } from '@/lib/locale-context'

interface FitnessScoreCardProps {
  score: FitnessScore
}

const DIMENSION_COLOR: Record<string, string> = {
  speed: 'bg-blue-500',
  power: 'bg-purple-500',
  endurance: 'bg-orange-500',
  flexibility: 'bg-green-500',
  strength: 'bg-red-500',
}

/**
 * FitnessScoreCard — displays overall fitness score with SVG arc and dimension bars.
 */
export default function FitnessScoreCard({ score }: FitnessScoreCardProps) {
  const { total, dimensions } = score
  const t = useT()
  const locale = useLocale()

  // SVG circle arc calculation
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (total / 100) * circumference

  const getScoreColor = useCallback((s: number) => {
    if (s >= 80) return 'text-green-400'
    if (s >= 60) return 'text-yellow-400'
    if (s >= 40) return 'text-orange-400'
    return 'text-red-400'
  }, [])

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('综合体能评分', 'Overall Fitness Score')}
      </h2>

      <div className="flex-1 flex flex-col justify-center">
        {/* SVG Score Circle */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140" aria-label={`体能评分 ${total} 分`}>
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#1f2937"
              strokeWidth="12"
            />
            {/* Score arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#6366f1"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute flex flex-col items-center">
            <span className={`text-4xl font-bold ${getScoreColor(total)}`}>
              {total}
            </span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Dimension scores */}
      <div className="mt-5 space-y-3">
        {Object.entries(dimensions).map(([key, dim]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-400">
                {locale === 'en' ? (DIMENSION_LABELS_EN[key as keyof typeof DIMENSION_LABELS_EN] ?? dim.label) : dim.label}
              </span>
              <span className={`font-mono font-semibold ${getScoreColor(dim.score)}`}>
                {dim.score}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-1.5 rounded-full transition-all ${DIMENSION_COLOR[key] ?? 'bg-indigo-500'}`}
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {total === 0 && (
        <p className="mt-4 text-center text-xs text-gray-500">
                    {t('尚无测试数据，评分将在录入成绩后显示', 'No test data yet. Scores will appear once results are recorded.')}
        </p>
      )}
      </div>
    </div>
  )
}

FitnessScoreCard.displayName = 'FitnessScoreCard'
