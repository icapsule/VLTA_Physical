'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { VirtualAthleteSchema, type VirtualAthleteFormValues } from '@/lib/validations/athlete'
import { createVirtualAthlete } from '@/lib/actions/athlete'
import { useRouter } from 'next/navigation'

interface AddVirtualAthleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddVirtualAthleteModal({ isOpen, onClose, onSuccess }: AddVirtualAthleteModalProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VirtualAthleteFormValues>({
    resolver: zodResolver(VirtualAthleteSchema),
    defaultValues: {
      full_name: '',
      gender: 'male',
      birth_date: '',
      height_cm: '' as any,
      weight_kg: '' as any,
      phone: '',
    },
  })

  if (!isOpen) return null

  const onSubmit = async (data: VirtualAthleteFormValues) => {
    setServerError(null)
    const result = await createVirtualAthlete(data)
    
    if (result.error) {
      setServerError(result.error)
    } else {
      reset()
      onSuccess?.()
      onClose()
      router.refresh() // Refresh the page to show the new user
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">新增虚拟学员 (免登录)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">姓名 *</label>
            <input
              {...register('full_name')}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="例如: 张三"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">性别 *</label>
            <select
              {...register('gender')}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
            {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">出生日期 *</label>
            <input
              type="date"
              {...register('birth_date')}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
            {errors.birth_date && <p className="mt-1 text-xs text-red-400">{errors.birth_date.message}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-300">身高 (cm)</label>
              <input
                type="number"
                {...register('height_cm', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
              {errors.height_cm && <p className="mt-1 text-xs text-red-400">{errors.height_cm.message as string}</p>}
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-300">体重 (kg)</label>
              <input
                type="number"
                {...register('weight_kg', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
              {errors.weight_kg && <p className="mt-1 text-xs text-red-400">{errors.weight_kg.message as string}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
