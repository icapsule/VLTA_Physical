'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import type { TestItem } from '@/lib/supabase/types'
import { testEntrySchema } from '@/lib/validations/test-results'
import { bulkInsertTestResults } from '@/lib/actions/test-results'

interface BulkTestEntryFormProps {
  athleteId: string
  athleteName: string
  testItems: TestItem[]
  coachId: string // Used previously, safely ignored by Action now but kept for prop structure compatibility
}

/**
 * BulkTestEntryForm — VLTA 2.0 (100% Client-Side Free SQL insertions)
 */
export default function BulkTestEntryForm({
  athleteId,
  athleteName,
  testItems,
}: BulkTestEntryFormProps) {
  const router = useRouter()
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<Record<number, { value: string; notes: string }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleValueChange = useCallback(
    (itemId: number, value: string) => {
      setEntries((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], value },
      }))
    },
    []
  )

  const handleNotesChange = useCallback(
    (itemId: number, notes: string) => {
      setEntries((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], notes },
      }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      const filledEntries = Object.entries(entries)
        .filter(([, v]) => v.value && v.value.trim() !== '')
        .map(([itemId, v]) => ({
          test_item_id: Number(itemId),
          result_value: v.value,
          notes: v.notes ?? '',
        }))

      if (filledEntries.length === 0) {
        setError('至少填写一项测试成绩')
        setLoading(false)
        return
      }

      // Payload building for Action Endpoint
      const payload = {
        athleteId,
        test_date: testDate,
        entries: filledEntries,
      }

      // Prescreen with Zod format checker
      const parsed = testEntrySchema.safeParse(payload)
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? '数据格式异常')
        setLoading(false)
        return
      }

      // VLTA 2.0: Fire to Server Action Layer
      const response = await bulkInsertTestResults(parsed.data)

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/coach/athletes/${athleteId}`)
          router.refresh()
        }, 1200)
      }
      
      setLoading(false)
    },
    [athleteId, testDate, entries, router]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Athlete + Date header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-gray-400">学员核心档</label>
          <p className="text-lg font-semibold text-white">{athleteName}</p>
        </div>
        <div>
          <label htmlFor="test_date" className="mb-1 block text-sm text-gray-300">
            录入测试时间 <span className="text-red-400">*</span>
          </label>
          <input
            id="test_date"
            type="date"
            value={testDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setTestDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">硬指标实测</th>
              <th className="px-4 py-3 text-left">单位标准</th>
              <th className="px-4 py-3 text-left">数值 (Value)</th>
              <th className="px-4 py-3 text-left">特殊说明 (Notes)</th>
            </tr>
          </thead>
          <tbody>
            {testItems.map((item) => (
              <tr key={item.id} className="border-t border-gray-700">
                <td className="px-4 py-3 text-gray-300">{item.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="输入成绩"
                    value={entries[item.id]?.value ?? ''}
                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                    className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="可选录备注（例：大风环境）"
                    value={entries[item.id]?.notes ?? ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
          ✅ 全维体能指标校验通过，写入成功即将跳转...
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || success}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Server校验网关中...' : '提交数据并固化到云端'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-700 px-6 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
        >
          取消
        </button>
      </div>
    </form>
  )
}

BulkTestEntryForm.displayName = 'BulkTestEntryForm'
