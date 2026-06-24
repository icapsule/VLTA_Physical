'use client'

import { useState } from 'react'
import type { TestItem } from '@/lib/supabase/types'
import { DIMENSION_LABELS } from '@/lib/utils/fitness-score'

export default function AdminMetricsClient({ initialMetrics }: { initialMetrics: TestItem[] }) {
  const [filterDimension, setFilterDimension] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredMetrics = initialMetrics.filter((m) => {
    const matchDimension = filterDimension === 'all' || m.dimension === filterDimension
    const matchType = filterType === 'all' || m.record_type === filterType
    return matchDimension && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Physical Test & Training Metrics (考核与训练指标字典)</h1>
        
        <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-indigo-500"
          >
            <option value="all">记录类型</option>
            <option value="test">🏅 评估测试</option>
            <option value="training">🏃 训练任务</option>
          </select>

          <select
            value={filterDimension}
            onChange={(e) => setFilterDimension(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-indigo-500"
          >
            <option value="all">维度分类</option>
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div className="rounded bg-yellow-900/30 border border-yellow-700/50 px-3 py-1.5 text-xs text-yellow-500">
            ⚠️ 核心数据资产，当前为只读模式
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700 bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                标识代码 (ID)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                中文名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                维度 (Dimension)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                记录类型 (Type)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                计算逻辑
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.map((m) => {
              const label = DIMENSION_LABELS[m.dimension as keyof typeof DIMENSION_LABELS] || m.dimension
              
              return (
                <tr key={m.id} className="border-b border-gray-800 transition-colors hover:bg-gray-800/30">
                  <td className="px-4 py-4 font-mono text-xs text-indigo-400">{m.id}</td>
                  <td className="px-4 py-4 font-medium text-white">{m.name_zh}</td>
                  <td className="px-4 py-4 text-gray-400">{label}</td>
                  <td className="px-4 py-4">
                    {m.record_type === 'test' ? (
                      <span className="rounded bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-300 border border-indigo-700/50">
                        🏅 评估测试
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-900/50 px-2 py-1 text-xs font-medium text-emerald-300 border border-emerald-700/50">
                        🏃 训练任务
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400 text-xs">单位: {m.unit === 'boolean' ? '无(通过制)' : m.unit}</span>
                      {m.unit !== 'boolean' && (
                        m.higher_is_better ? (
                          <span className="w-max rounded bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400 border border-green-800/50">数值越大越好 ↑</span>
                        ) : (
                          <span className="w-max rounded bg-blue-900/30 px-2 py-0.5 text-[10px] text-blue-400 border border-blue-800/50">数值越小越好 ↓</span>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
