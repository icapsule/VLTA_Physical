'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import type { TestItem } from '@/lib/supabase/types'

const testEntrySchema = z.object({
  test_date: z
    .string()
    .min(1)
    .refine((d) => new Date(d) <= new Date(), '测试日期不能是未来日期'),
  entries: z.array(
    z.object({
      test_item_id: z.number(),
      result_value: z.string(),
      notes: z.string().optional(),
    })
  ),
})

interface BulkTestEntryFormProps {
  athleteId: string
  athleteName: string
  testItems: TestItem[]
  coachId: string
}

/**
 * BulkTestEntryForm — allows coach to record multiple test results at once for one athlete.
 */
export default function BulkTestEntryForm({
  athleteId,
  athleteName,
  testItems,
  coachId,
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

      // Filter out empty entries
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

      // Validate with Zod
      const parsed = testEntrySchema.safeParse({
        test_date: testDate,
        entries: filledEntries,
      })

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? '数据格式错误')
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const inserts = parsed.data.entries.map((entry) => ({
          athlete_id: athleteId,
          test_item_id: entry.test_item_id,
          result_value: parseFloat(entry.result_value),
          test_date: parsed.data.test_date,
          notes: entry.notes || null,
          created_by: coachId,
        }))

        const { error: insertError } = await supabase
          .from('test_results')
          .insert(inserts)

        if (insertError) throw insertError

        setSuccess(true)
        setTimeout(() => {
          router.push(`/coach/athletes/${athleteId}`)
          router.refresh()
        }, 1200)
      } catch (err) {
        const e = err as { message: string }
        setError(e.message ?? '提交失败，请重试')
      } finally {
        setLoading(false)
      }
    },
    [athleteId, coachId, testDate, entries, router]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Athlete + Date header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-gray-400">学员</label>
          <p className="text-lg font-semibold text-white">{athleteName}</p>
        </div>
        <div>
          <label htmlFor="test_date" className="mb-1 block text-sm text-gray-300">
            测试日期 <span className="text-red-400">*</span>
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

      {/* Test items table */}
      <div className="overflow-hidden rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">测试项目</th>
              <th className="px-4 py-3 text-left">单位</th>
              <th className="px-4 py-3 text-left">成绩</th>
              <th className="px-4 py-3 text-left">备注</th>
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
                    aria-label={`${item.name} 成绩输入`}
                    className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="可选备注"
                    value={entries[item.id]?.notes ?? ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    aria-label={`${item.name} 备注`}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
          ✅ 成绩已录入，正在跳转...
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || success}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '提交中...' : '提交成绩'}
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
