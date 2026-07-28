'use client'

import { useState } from 'react'
import { displayMetricValue, parseTimeStringToSeconds } from '@/lib/utils/format'
import { updateAssessmentLog, deleteAssessmentLog } from '@/lib/actions/assessment-log-action'
import { useT, useLocale } from '@/lib/locale-context'

const METRIC_NAME_EN: Record<string, string> = {
  '立定跳远': 'Standing Long Jump',
  '10米冲刺': '10m Sprint',
  '20米': '20m Sprint',
  '100米': '100m',
  '200米': '200m',
  '400米': '400m',
  '800米': '800m',
  '1000米': '1000m',
  '1500米': '1500m',
  '3000米': '3000m',
  '10x5折返跑': '10x5 Shuttle Run',
  '坐位体前屈': 'Sit-and-Reach',
  '实心球': 'Medicine Ball Throw',
  '引体向上': 'Pull-ups',
  'Yo-Yo测试': 'Yo-Yo Test',
}

export default function AssessmentLogTable({
  results,
  isEditable = false
}: {
  results: any[]
  isEditable?: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editResult, setEditResult] = useState<string>('')
  const [editPassed, setEditPassed] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const t = useT()
  const locale = useLocale()
  const getMetricName = (nameZh: string) => locale === 'en' ? (METRIC_NAME_EN[nameZh] ?? nameZh) : nameZh

  const startEdit = (r: any) => {
    setEditingId(r.id)
    setEditDate(r.assessments?.test_date || '')
    
    // For editing, pre-fill with the smartly formatted string (e.g. 2250 -> "37:30.00")
    if (r.best_result !== null && r.best_result !== undefined) {
      setEditResult(displayMetricValue(r.best_result, r.test_metrics?.unit))
    } else {
      setEditResult('')
    }
    setEditPassed(Boolean(r.is_passed))
  }

  const handleSave = async (resultId: string) => {
    setIsLoading(true)
    
    // Convert back from "37:30.00" string into 2250 seconds float (if applicable)
    const parsedValue = editResult ? parseTimeStringToSeconds(editResult) : null

    const { success, error } = await updateAssessmentLog({
      resultId,
      newDate: editDate,
      newResult: parsedValue,
      newIsPassed: editPassed
    })
    
    setIsLoading(false)
    if (success) {
      setEditingId(null)
    } else {
      alert(error || 'Failed to update record')
    }
  }

  const handleDelete = async (resultId: string) => {
    if (!confirm(t('确定要删除这条记录吗？此操作不可恢复。', 'Are you sure you want to delete this record? This cannot be undone.'))) return

    setIsLoading(true)
    const { success, error } = await deleteAssessmentLog(resultId)
    setIsLoading(false)
    if (success) {
      setEditingId(null)
    } else {
      alert(error || 'Failed to delete record')
    }
  }

  if (results.length === 0) {
    return <p className="text-sm text-gray-500">{t("暂无测试记录", "No records yet")}</p>
  }

  return (
    <div className="max-h-[600px] overflow-y-auto overflow-x-auto rounded-lg border border-gray-800/50">
      <table className="w-full text-sm relative">
        <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs text-gray-500 shadow-sm">
          <tr>
            <th className="pb-2 pr-4">{t("日期", "Date")}</th>
            <th className="pb-2 pr-4">{t("项目", "Event")}</th>
            <th className="pb-2 pr-4">{t("最好成绩", "Best Result")}</th>
            <th className="pb-2 pr-4">{t("完成状态", "Status")}</th>
            <th className="pb-2 pr-4">{t("所有尝试", "All Attempts")}</th>
            {isEditable && <th className="pb-2">{t("操作", "Actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const isEditing = editingId === r.id
            const recordType = r.test_metrics?.record_type
            
            if (isEditing) {
              return (
                <tr key={r.id} className="border-b border-gray-800/50 bg-gray-800/50">
                  <td className="py-3 pr-4">
                    <input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="rounded bg-gray-900 px-2 py-1 text-gray-300 border border-gray-700 focus:border-indigo-500 focus:outline-none w-32"
                    />
                  </td>
                  <td className="py-3 pr-4 text-gray-300">
                    {getMetricName(r.test_metrics?.name_zh)}
                  </td>
                  <td className="py-3 pr-4">
                    {recordType === 'test' ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={editResult}
                          onChange={(e) => setEditResult(e.target.value)}
                          className="rounded bg-gray-900 px-2 py-1 text-gray-300 border border-gray-700 focus:border-indigo-500 focus:outline-none w-24"
                        />
                        <span className="text-gray-500">{r.test_metrics?.unit}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-3 pr-4">
                    {recordType === 'training' ? (
                      <select 
                        value={editPassed ? 'true' : 'false'}
                        onChange={(e) => setEditPassed(e.target.value === 'true')}
                        className="rounded bg-gray-900 px-2 py-1 text-gray-300 border border-gray-700 focus:outline-none"
                      >
                        <option value="true">✅ 已完成</option>
                        <option value="false">❌ 未完成</option>
                      </select>
                    ) : '-'}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">-</td>
                  <td className="py-3 flex items-center gap-2">
                    <button 
                      onClick={() => handleSave(r.id)}
                      disabled={isLoading}
                      className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isLoading ? '...' : t('保存', 'Save')}
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      disabled={isLoading}
                      className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      {t('取消', 'Cancel')}
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      disabled={isLoading}
                      className="rounded border border-red-500/50 text-red-400 px-3 py-1 text-xs hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      title={t('删除记录', 'Delete record')}>
                      {t('删除', 'Delete')}
                    </button>
                  </td>
                </tr>
              )
            }

            return (
              <tr key={r.id} className="group border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-4 font-mono text-gray-400">{r.assessments?.test_date}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{getMetricName(r.test_metrics?.name_zh)}</span>
                    {recordType === 'test' ? (
                      <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-700/50">{t('🏅 评估测试', '🏅 Assessment')}</span>
                    ) : (
                      <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-700/50">{t('🏃 训练任务', '🏃 Training')}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 font-mono font-semibold text-indigo-400">
                  {recordType === 'test' && r.best_result !== null ? `${displayMetricValue(Number(r.best_result), r.test_metrics?.unit)} ${r.test_metrics?.unit}` : '-'}
                </td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {recordType === 'training' 
                    ? (r.is_passed ? <span className="text-emerald-400">{t('✅ 已完成', '✅ Done')}</span> : <span className="text-red-400">{t('❌ 未完成', '❌ Not Done')}</span>)
                    : <span className="text-gray-600">-</span>
                  }
                </td>
                <td className="py-3 pr-4 font-mono text-gray-500 text-xs">
                  {recordType === 'test' && r.attempts && Array.isArray(r.attempts) ? r.attempts.map((val: any) => displayMetricValue(Number(val), r.test_metrics?.unit)).join(' / ') : '-'}
                </td>
                {isEditable && (
                  <td className="py-3">
                    <button 
                      onClick={() => startEdit(r)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-400 text-xs flex items-center gap-1"
                    >
                      <span>✏️</span> {t('编辑', 'Edit')}
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
