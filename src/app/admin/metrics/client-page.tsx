'use client'

import { useState } from 'react'
import type { TestItem } from '@/lib/supabase/types'
import { toggleMetricInRadar } from '@/app/admin/actions'
import { DIMENSION_LABELS } from '@/lib/utils/fitness-score'

export default function AdminMetricsClient({ initialMetrics }: { initialMetrics: TestItem[] }) {
  const [metrics, setMetrics] = useState<TestItem[]>(initialMetrics)
  const [filterDimension, setFilterDimension] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [isPending, setIsPending] = useState(false)

  const handleToggleRadar = async (metricId: string, currentStatus: boolean) => {
    setIsPending(true)
    // Optimistic update
    setMetrics(prev => prev.map(m => m.id === metricId ? { ...m, in_radar: !currentStatus } : m))
    
    const { success, error } = await toggleMetricInRadar(metricId, !currentStatus)
    
    if (!success) {
      alert(error || 'Failed to update configuration')
      // Revert if failed
      setMetrics(prev => prev.map(m => m.id === metricId ? { ...m, in_radar: currentStatus } : m))
    }
    setIsPending(false)
  }

  const filteredMetrics = metrics.filter((m) => {
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

      {/* Scoring Standards Explanation Module */}
      <div className="rounded-2xl border border-indigo-900/50 bg-indigo-900/10 p-5">
        <h2 className="mb-3 text-sm font-semibold text-indigo-300 flex items-center gap-2">
          <span>📚 科学评分引擎底层逻辑 (Scientific Scoring Logic)</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4">
            <h3 className="font-semibold text-gray-300 mb-2">🔰 常规青少年标准 (Regular Mode)</h3>
            <p className="text-gray-400 mb-2">
              用于评估普通学龄青少年的体质发育与健康水平，真实映射青春期（特别是 12-15 岁突增期）的非线性生理变化规律。
            </p>
            <div className="mt-3 border-t border-gray-800 pt-3">
              <span className="text-gray-500 block mb-1">主要数据参考源：</span>
              <ul className="list-disc list-inside text-gray-400 space-y-1">
                <li>《国家学生体质健康标准（2014年修订）》</li>
                <li>中小学生体育考核国标大纲</li>
              </ul>
            </div>
          </div>
          
          <div className="rounded-xl bg-indigo-950/40 border border-indigo-900/40 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">👑</div>
            <h3 className="font-semibold text-indigo-400 mb-2 relative z-10">👑 精英运动员标准 (Elite Mode)</h3>
            <p className="text-indigo-200/70 mb-2 relative z-10">
              用于筛选和评估具有竞技体育潜力的好苗子。以 18 岁达到国家二级/三级运动员门槛为天花板，结合 LTAD 规律反推至 8 岁。
            </p>
            <div className="mt-3 border-t border-indigo-900/40 pt-3 relative z-10">
              <span className="text-indigo-400/60 block mb-1">主要数据参考源：</span>
              <ul className="list-disc list-inside text-indigo-200/80 space-y-1">
                <li>《中国田径运动员技术等级标准 (2025新规)》</li>
                <li>ITF / USTA 青少年网球体能测试常模</li>
              </ul>
            </div>
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                评分标准基线 (0分 → 100分)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                雷达图开关
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
                  <td className="px-4 py-4">
                    {m.scoring_matrix && typeof m.scoring_matrix === 'object' ? (
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="rounded bg-gray-800/80 p-2 border border-gray-700">
                          <div className="text-gray-300 font-semibold mb-1">常规标准 (多维查表)</div>
                          <div className="text-gray-400">8岁男: <span className="text-red-400">{m.scoring_matrix?.regular?.male?.['8']?.min_0}</span> → <span className="text-emerald-400">{m.scoring_matrix?.regular?.male?.['8']?.max_100}</span></div>
                          <div className="text-gray-500 text-[10px] mt-0.5">...覆盖 8-18 岁独立男女曲线</div>
                        </div>
                        <div className="rounded bg-indigo-900/20 p-2 border border-indigo-900/50">
                          <div className="text-indigo-300 font-semibold mb-1">精英标准 (多维查表)</div>
                          <div className="text-gray-400">8岁男: <span className="text-red-400">{m.scoring_matrix?.elite?.male?.['8']?.min_0}</span> → <span className="text-emerald-400">{m.scoring_matrix?.elite?.male?.['8']?.max_100}</span></div>
                          <div className="text-gray-500 text-[10px] mt-0.5">...覆盖 8-18 岁独立男女曲线</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs italic">无打分配置</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggleRadar(m.id, Boolean(m.in_radar))}
                      disabled={isPending}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        m.in_radar ? 'bg-indigo-600' : 'bg-gray-700'
                      }`}
                      title={m.in_radar ? '点击取消雷达图基准' : '点击设为雷达图基准'}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          m.in_radar ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
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
