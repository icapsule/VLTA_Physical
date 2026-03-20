'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import type { Profile } from '@/lib/supabase/types'

const planSchema = z.object({
  title: z.string().min(3, '标题至少 3 个字符'),
  description: z.string().optional(),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().min(1, '请选择结束日期'),
}).refine((d) => d.end_date >= d.start_date, {
  message: '结束日期必须晚于开始日期',
  path: ['end_date'],
}).refine(
  (d) => {
    const start = new Date(d.start_date)
    const end = new Date(d.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return days <= 90
  },
  { message: '计划天数不能超过 90 天', path: ['end_date'] }
)

interface NewPlanFormProps {
  athletes: Pick<Profile, 'id' | 'full_name'>[]
  coachId: string
}

/**
 * NewPlanForm — client component for creating training plans with athlete assignment.
 */
export default function NewPlanForm({ athletes, coachId }: NewPlanFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedAthlete = searchParams.get('athlete')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  })
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(
    preselectedAthlete ? [preselectedAthlete] : []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: '' }))
    },
    []
  )

  const toggleAthlete = useCallback((id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setServerError(null)

      if (selectedAthletes.length === 0) {
        setErrors((prev) => ({ ...prev, athletes: '至少选择 1 名学员' }))
        setLoading(false)
        return
      }

      const parsed = planSchema.safeParse(formData)
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          fieldErrors[String(issue.path[0])] = issue.message
        }
        setErrors(fieldErrors)
        setLoading(false)
        return
      }

      const supabase = createClient()

      try {
        // Insert training plan
        const { data: plan, error: planError } = await supabase
          .from('training_plans')
          .insert({
            coach_id: coachId,
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            start_date: parsed.data.start_date,
            end_date: parsed.data.end_date,
            plan_details: { days: [] },
            is_active: true,
          })
          .select('id')
          .single()

        if (planError) throw planError

        // Assign to athletes
        const assignments = selectedAthletes.map((athlete_id) => ({
          plan_id: plan.id,
          athlete_id,
        }))

        const { error: assignError } = await supabase
          .from('plan_assignments')
          .insert(assignments)

        if (assignError) throw assignError

        router.push('/coach/plans')
        router.refresh()
      } catch (err) {
        const e = err as { message: string }
        setServerError(e.message ?? '创建失败，请重试')
      } finally {
        setLoading(false)
      }
    },
    [formData, selectedAthletes, coachId, router]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-gray-300">
          计划名称 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="例如：夏季体能强化计划"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm text-gray-300">
          描述（可选）
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="简要描述训练目标和内容..."
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Date range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_date" className="mb-1 block text-sm text-gray-300">
            开始日期 <span className="text-red-400">*</span>
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.start_date && <p className="mt-1 text-xs text-red-400">{errors.start_date}</p>}
        </div>
        <div>
          <label htmlFor="end_date" className="mb-1 block text-sm text-gray-300">
            结束日期 <span className="text-red-400">*</span>
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            min={formData.start_date}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.end_date && <p className="mt-1 text-xs text-red-400">{errors.end_date}</p>}
        </div>
      </div>

      {/* Athlete selection */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm text-gray-300">
            分配给学员 <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-gray-500">已选 {selectedAthletes.length} 人</span>
        </div>
        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-3 sm:grid-cols-2">
          {athletes.map((athlete) => (
            <label
              key={athlete.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                selectedAthletes.includes(athlete.id)
                  ? 'bg-indigo-600/30 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAthletes.includes(athlete.id)}
                onChange={() => toggleAthlete(athlete.id)}
                className="accent-indigo-500"
              />
              {athlete.full_name}
            </label>
          ))}
        </div>
        {errors.athletes && <p className="mt-1 text-xs text-red-400">{errors.athletes}</p>}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '创建中...' : '创建计划'}
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

NewPlanForm.displayName = 'NewPlanForm'
