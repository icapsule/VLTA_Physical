/**
 * Fitness Score Algorithm
 *
 * Dual-Mode Yearly Scoring System (Regular vs Elite)
 * Uses a baseline at Age 9, and linearly extrapolates up to Age 18
 * using growth factors.
 */

export type ScoringMode = 'regular' | 'elite'

export interface ScoreConfig {
  metricId: string
  /** Performance value that maps to 0 (worst acceptable) */
  min: number
  /** Performance value that maps to 100 (elite level) */
  max: number
}

export interface DimensionScore {
  label: string
  score: number
  /** 0-1 weight for this dimension */
  weight: number
}

export interface FitnessScore {
  total: number
  dimensions: {
    speed: DimensionScore
    power: DimensionScore
    endurance: DimensionScore
    flexibility: DimensionScore
    strength: DimensionScore
    agility: DimensionScore
  }
}

// Hardcoded baselines removed. 
// Now completely database-driven using TestItem columns.

import type { TestItem, Gender } from '@/lib/supabase/types'

/** Age/Gender-based scoring configuration using JSONB matrix from Database */
export function getScoreConfig(age: number, gender: Gender | null, mode: ScoringMode, metrics: TestItem[]): ScoreConfig[] {
  // Cap age extrapolation between 8 and 18 for lookup
  const lookupAge = Math.max(8, Math.min(18, age)).toString()
  // Default to male if gender is unknown or other, just for the sake of having a baseline
  const lookupGender = gender === 'female' ? 'female' : 'male'

  return metrics.map(m => {
    // If scoring matrix is missing, return a dummy config (it will be ignored later)
    if (!m.scoring_matrix || !m.scoring_matrix[mode] || !m.scoring_matrix[mode][lookupGender]) {
      return { metricId: m.id, min: NaN, max: NaN }
    }

    const standard = m.scoring_matrix[mode][lookupGender][lookupAge]
    if (!standard) {
      // Basic fallback if age is specifically missing but matrix exists
      return { metricId: m.id, min: NaN, max: NaN }
    }

    return {
      metricId: m.id,
      min: standard.min_0,
      max: standard.max_100,
    }
  }).filter(c => !isNaN(c.min) && !isNaN(c.max))
}

/**
 * Maps a single test result value to a 0-100 score.
 */
export function calculateItemScore(value: number | boolean, config?: ScoreConfig): number {
  if (typeof value === 'boolean') {
    return value ? 100 : 0;
  }
  
  if (!config) return 0;
  
  const { min, max } = config
  
  // Calculate how far along the value is between min and max (can be negative if worse than min)
  const ratio = (value - min) / (max - min)
  
  // min maps to 60 points, max maps to 100 points. 
  // 40 is the spread between pass (60) and perfect (100).
  const rawScore = 60 + (ratio * 40)
  
  // Clamp the final score strictly between 0 and 100
  const clamped = Math.max(0, Math.min(100, rawScore))
  
  return Math.round(clamped)
}

// Removed hardcoded ITEM_TO_DIMENSION since dimension comes dynamically from the TestItem dictionary

export const DIMENSION_LABELS: Record<keyof FitnessScore['dimensions'], string> = {
  speed: '⚡️ 速度',
  power: '💥 爆发力',
  endurance: '🫁 耐力',
  flexibility: '🐍 柔韧性',
  strength: '🦾 力量',
  agility: '🌪️ 敏捷性',
}

export const DIMENSION_WEIGHTS: Record<keyof FitnessScore['dimensions'], number> = {
  speed: 0.20,
  power: 0.20,
  agility: 0.20,
  endurance: 0.20,
  flexibility: 0.10,
  strength: 0.10,
}

export function calculateFitnessScore(
  results: Record<string, number | boolean>,
  metrics: TestItem[],
  age: number = 10,
  gender: Gender | null = 'male',
  mode: ScoringMode = 'regular'
): FitnessScore {
  // Accumulate raw item scores per dimension
  const dimensionRaws: Record<string, number[]> = {}
  const scoreConfigList = getScoreConfig(age, gender, mode, metrics)

  for (const [metricId, value] of Object.entries(results)) {
    if (value === undefined || value === null) continue

    const metricDefinition = metrics.find(m => m.id === metricId)
    if (!metricDefinition) continue

    // Skip if the metric is explicitly opted out of radar
    if (metricDefinition.in_radar === false) continue

    const dimension = metricDefinition.dimension as keyof FitnessScore['dimensions']
    if (!dimension) continue

    const config = scoreConfigList.find(c => c.metricId === metricId)
    if (!config && typeof value !== 'boolean') continue // Skip if no config, instead of dragging down to 0
    
    const score = calculateItemScore(value, config)
    
    if (!dimensionRaws[dimension]) dimensionRaws[dimension] = []
    dimensionRaws[dimension].push(score)
  }

  // Average scores within each dimension
  const dimensions = {} as FitnessScore['dimensions']
  let weightedTotal = 0
  let totalWeight = 0

  for (const key of Object.keys(DIMENSION_WEIGHTS) as Array<keyof FitnessScore['dimensions']>) {
    const raws = dimensionRaws[key] ?? []
    const score = raws.length > 0
      ? Math.round(raws.reduce((a, b) => a + b, 0) / raws.length)
      : 0

    const weight = DIMENSION_WEIGHTS[key]
    dimensions[key] = { label: DIMENSION_LABELS[key], score, weight }

    if (raws.length > 0) {
      weightedTotal += score * weight
      totalWeight += weight
    }
  }

  const total = totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0

  return { total, dimensions }
}
