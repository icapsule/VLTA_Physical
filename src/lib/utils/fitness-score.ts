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

interface GrowthConfig {
  baseMin: number
  baseMax: number
  minGrowth: number
  maxGrowth: number
}

type MetricConfigMap = Record<ScoringMode, GrowthConfig>

// Baseline is age 9.
const METRIC_GROWTH: Record<string, MetricConfigMap> = {
  standing_long_jump: {
    regular: { baseMin: 100, baseMax: 180, minGrowth: 6, maxGrowth: 8 },
    elite:   { baseMin: 120, baseMax: 200, minGrowth: 8, maxGrowth: 10 },
  },
  sprint_10m: {
    regular: { baseMin: 2.8, baseMax: 1.8, minGrowth: -0.05, maxGrowth: -0.05 },
    elite:   { baseMin: 2.6, baseMax: 1.7, minGrowth: -0.06, maxGrowth: -0.06 },
  },
  sprint_20m: {
    regular: { baseMin: 5.5, baseMax: 3.9, minGrowth: -0.15, maxGrowth: -0.12 },
    elite:   { baseMin: 5.2, baseMax: 3.7, minGrowth: -0.18, maxGrowth: -0.15 },
  },
  shuttle_10x5: {
    regular: { baseMin: 17.5, baseMax: 14.0, minGrowth: -0.3, maxGrowth: -0.4 },
    elite:   { baseMin: 16.5, baseMax: 13.0, minGrowth: -0.4, maxGrowth: -0.5 },
  },
  sit_and_reach: {
    regular: { baseMin: 0, baseMax: 20, minGrowth: 0.5, maxGrowth: 1 },
    elite:   { baseMin: 5, baseMax: 25, minGrowth: 0.5, maxGrowth: 1 },
  },
  pull_up: {
    regular: { baseMin: 0, baseMax: 8, minGrowth: 0, maxGrowth: 1 },
    elite:   { baseMin: 0, baseMax: 15, minGrowth: 1, maxGrowth: 2 },
  }
}

/** Age-based scoring configuration using Growth Factor */
export function getScoreConfig(age: number, mode: ScoringMode): ScoreConfig[] {
  // Cap age extrapolation between 9 and 18
  const clampedAge = Math.max(9, Math.min(18, age))
  const years = clampedAge - 9

  return Object.keys(METRIC_GROWTH).map(metricId => {
    const config = METRIC_GROWTH[metricId][mode]
    return {
      metricId,
      min: config.baseMin + config.minGrowth * years,
      max: config.baseMax + config.maxGrowth * years,
    }
  })
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
  const ratio = (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, ratio))
  
  return Math.round(clamped * 100)
}

/** Maps test item ID → fitness dimension */
export const ITEM_TO_DIMENSION: Record<string, keyof FitnessScore['dimensions']> = {
  standing_long_jump: 'power',
  sprint_10m: 'speed',
  sprint_20m: 'speed',
  shuttle_10x5: 'agility',
  sprint_100m: 'speed',
  sprint_200m: 'speed',
  run_400m: 'endurance',
  run_800m: 'endurance',
  run_1000m: 'endurance',
  run_3000m: 'endurance',
  run_5000m: 'endurance',
  sit_and_reach: 'flexibility',
  pull_up: 'strength',
  push_up: 'strength',
}

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

/**
 * Calculates a full fitness score from a map of test results.
 * @param results - { [metricId]: resultValue (number | boolean) }
 * @param age - Athlete's age to use appropriate scoring norms
 * @param mode - 'regular' or 'elite' standards
 */
export function calculateFitnessScore(
  results: Record<string, number | boolean>,
  age: number = 10,
  mode: ScoringMode = 'regular'
): FitnessScore {
  // Accumulate raw item scores per dimension
  const dimensionRaws: Record<string, number[]> = {}
  const scoreConfigList = getScoreConfig(age, mode)

  for (const [metricId, value] of Object.entries(results)) {
    if (value === undefined || value === null) continue

    const dimension = ITEM_TO_DIMENSION[metricId]
    if (!dimension) continue

    const config = scoreConfigList.find(c => c.metricId === metricId)
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
