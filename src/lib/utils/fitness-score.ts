/**
 * Fitness Score Algorithm
 *
 * Based on PRD v2 Section 9: linear mapping of raw test values to 0-100 scores,
 * then weighted average across 5 dimensions (Speed, Power, Endurance, Flexibility, Strength).
 */

export interface ScoreConfig {
  testItemId: number
  /** Performance value that maps to 0 (worst acceptable) */
  min: number
  /** Performance value that maps to 100 (elite level) */
  max: number
  higherIsBetter: boolean
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
  }
}

/** Scoring configuration per test item (PRD §9) */
export const SCORE_CONFIG: ScoreConfig[] = [
  { testItemId: 1, min: 100, max: 250, higherIsBetter: true  }, // 立定跳远 cm
  { testItemId: 2, min: 0,   max: 25,  higherIsBetter: true  }, // 坐位体前屈 cm
  { testItemId: 3, min: 12,  max: 6,   higherIsBetter: false }, // 50米跑 秒
  { testItemId: 4, min: 480, max: 200, higherIsBetter: false }, // 1000米跑 秒
  { testItemId: 5, min: 0,   max: 20,  higherIsBetter: true  }, // 引体向上 次
  { testItemId: 6, min: 1,   max: 15,  higherIsBetter: true  }, // Beep Test 级
  { testItemId: 7, min: 25,  max: 13,  higherIsBetter: false }, // 蜘蛛跑 秒
]

/**
 * Maps a single test result value to a 0-100 score.
 */
export function calculateItemScore(value: number, config: ScoreConfig): number {
  const { min, max, higherIsBetter } = config
  const ratio = (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, higherIsBetter ? ratio : 1 - ratio))
  return Math.round(clamped * 100)
}

/** Maps test item ID → fitness dimension */
const ITEM_TO_DIMENSION: Record<number, keyof FitnessScore['dimensions']> = {
  1: 'power',       // 立定跳远
  2: 'flexibility', // 坐位体前屈
  3: 'speed',       // 50米跑
  4: 'endurance',   // 1000米跑
  5: 'strength',    // 引体向上
  6: 'endurance',   // Beep Test
  7: 'speed',       // 蜘蛛跑
}

const DIMENSION_LABELS: Record<keyof FitnessScore['dimensions'], string> = {
  speed: '速度',
  power: '爆发力',
  endurance: '耐力',
  flexibility: '柔韧性',
  strength: '力量',
}

const DIMENSION_WEIGHTS: Record<keyof FitnessScore['dimensions'], number> = {
  speed: 0.25,
  power: 0.25,
  endurance: 0.25,
  flexibility: 0.15,
  strength: 0.10,
}

/**
 * Calculates a full fitness score from a map of test results.
 * @param results - { [testItemId]: resultValue }
 */
export function calculateFitnessScore(
  results: Record<number, number>
): FitnessScore {
  // Accumulate raw item scores per dimension
  const dimensionRaws: Record<string, number[]> = {}

  for (const config of SCORE_CONFIG) {
    const value = results[config.testItemId]
    if (value === undefined) continue

    const dimension = ITEM_TO_DIMENSION[config.testItemId]
    if (!dimension) continue

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
