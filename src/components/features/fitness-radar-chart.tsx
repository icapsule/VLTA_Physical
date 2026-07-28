'use client'

import { useState, useEffect } from 'react'
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
import { DIMENSION_LABELS, DIMENSION_LABELS_EN } from '@/lib/utils/fitness-score'
import type { TestItem } from '@/lib/supabase/types'
import { useT, useLocale, useMetricName } from '@/lib/locale-context'

interface FitnessRadarChartProps {
  score: FitnessScore
  metrics?: TestItem[]
}




export default function FitnessRadarChart({ score, metrics }: FitnessRadarChartProps) {
  const [mounted, setMounted] = useState(false)
  const t = useT()
  const locale = useLocale()

  const dimLabels = locale === 'en' ? DIMENSION_LABELS_EN : DIMENSION_LABELS
  const getMetricName = useMetricName()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use locale-aware dimension labels on the radar axes
  const data = Object.entries(score.dimensions).map(([key, dim]) => ({
    subject: dimLabels[key as keyof typeof dimLabels] ?? dim.label,
    A: dim.score,
    fullMark: 100,
  }))

  const benchmarkMetrics = metrics?.filter(m => m.in_radar !== false && m.record_type === 'test') || []
  
  // Group benchmark metrics by dimension
  const benchmarksByDimension = benchmarkMetrics.reduce((acc, m) => {
    if (!acc[m.dimension]) acc[m.dimension] = []
    acc[m.dimension].push(getMetricName(m.name_zh))
    return acc
  }, {} as Record<string, string[]>)

  if (score.total === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
        <p className="text-sm text-gray-500">{t('暂无测试数据无法生成雷达图', 'No test data available to render radar chart')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('能力雷达图', 'Fitness Radar')}
      </h2>
      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="flex-1 min-h-[250px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart id="fitness-radar-chart-svg" cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                <Radar
                  name={t('能力评分', 'Fitness Score')}
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
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-gray-600 text-sm">{t('加载图表中...', 'Loading chart...')}</span>
            </div>
          )}
        </div>
        
        {/* Benchmark Legend */}
        {metrics && (
          <div className="w-full md:w-1/3 flex flex-col justify-center space-y-4 rounded-xl bg-gray-950/50 p-4 border border-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-800 pb-2">
              {t('基准测试项目 (Benchmarks)', 'Benchmark Events')}
            </h3>
            <div className="space-y-3">
              {Object.entries(dimLabels).map(([dimKey, dimLabel]) => {
                const tests = benchmarksByDimension[dimKey]
                if (!tests || tests.length === 0) return null
                
                return (
                  <div key={dimKey} className="text-sm">
                    <div className="text-gray-400 font-medium">{dimLabel}</div>
                    <div className="text-indigo-300 text-xs mt-1 leading-relaxed">
                      {tests.join(' / ')}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-600 mt-4 pt-2 border-t border-gray-800/50 italic">
              {t(
                '* 雷达图分数仅根据上述被勾选为 Benchmark 的核心专项测试计算，非基准项或训练记录不影响雷达图，以保证竞技雷达的纯粹性。',
                '* Radar score is calculated only from the benchmark events above. Non-benchmark items and training logs are excluded to maintain competitive purity.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
