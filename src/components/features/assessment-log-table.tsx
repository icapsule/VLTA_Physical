'use client'

import { useState } from 'react'
import { displayMetricValue, parseTimeStringToSeconds } from '@/lib/utils/format'
import { updateAssessmentLog, deleteAssessmentLog } from '@/lib/actions/assessment-log-action'

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
    if (!confirm('确定要删除这条记录吗？此操作不可恢复。')) return

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
    return <p className="text-sm text-gray-500">暂无测试记录</p>
  }

  return (
    <div className="max-h-[600px] overflow-y-auto overflow-x-auto rounded-lg border border-gray-800/50">
      <table className="w-full text-sm relative">
        <thead className="sticky top-0 z-10 bg-gray-900 text-left text-xs text-gray-500 shadow-sm">
          <tr>
            <th className="pb-2 pr-4">日期</th>
            <th className="pb-2 pr-4">项目</th>
            <th className="pb-2 pr-4">最好成绩</th>
            <th className="pb-2 pr-4">完成状态</th>
            <th className="pb-2 pr-4">所有尝试</th>
            {isEditable && <th className="pb-2">操作</th>}
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
                    {r.test_metrics?.name_zh}
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
                      {isLoading ? '...' : '保存'}
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      disabled={isLoading}
                      className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      disabled={isLoading}
                      className="rounded border border-red-500/50 text-red-400 px-3 py-1 text-xs hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      title="删除记录"
                    >
                      删除
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
                    <span className="text-gray-300">{r.test_metrics?.name_zh}</span>
                    {recordType === 'test' ? (
                      <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-700/50">🏅 评估测试</span>
                    ) : (
                      <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-700/50">🏃 训练任务</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 font-mono font-semibold text-indigo-400">
                  {recordType === 'test' && r.best_result !== null ? `${displayMetricValue(Number(r.best_result), r.test_metrics?.unit)} ${r.test_metrics?.unit}` : '-'}
                </td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {recordType === 'training' 
                    ? (r.is_passed ? <span className="text-emerald-400">✅ 已完成</span> : <span className="text-red-400">❌ 未完成</span>)
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
                      <span>✏️</span> 编辑
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
