'use client'

import { useState, useCallback } from 'react'
import type { Profile } from '@/lib/supabase/types'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'
import { updateProfile } from '@/lib/actions/profile'
import { UserButton } from '@clerk/nextjs'

interface ProfileFormProps {
  profile: Profile | null
  userEmail: string
  userId: string
}

/**
 * ProfileForm — VLTA 2.0 Client Component.
 * Fully decoupled from Supabase Object Storage. Relies on Clerk Server Actions for IO.
 */
export default function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    gender: profile?.gender ?? '',
    birth_date: profile?.birth_date ?? '',
    height_cm: profile?.height_cm ?? '',
    weight_kg: profile?.weight_kg ?? '',
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: undefined }))
      setSuccess(false)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setServerError(null)
      setSuccess(false)

      const parsed = profileSchema.safeParse(formData)
      if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {}
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof ProfileFormData
          fieldErrors[key] = issue.message
        }
        setErrors(fieldErrors)
        setLoading(false)
        return
      }

      // VLTA 2.0: 纯 Server Action 架构，拒绝直接通过 client 去操作数据库
      const response = await updateProfile(parsed.data)
      
      if (response.error) {
        setServerError(response.error)
      } else {
        setSuccess(true)
      }
      
      setLoading(false)
    },
    [formData]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Clerk 托管的头像 */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
        <UserButton 
           appearance={{ elements: { userButtonAvatarBox: "w-20 h-20" } }} 
        />
        <div>
          <h3 className="text-lg font-medium text-white">账户头像</h3>
          <p className="mt-0.5 text-xs text-gray-500">点击左侧图像即可通过 Clerk 直接管理头像</p>
        </div>
      </div>

      {/* Read-only email */}
      <div>
        <label className="mb-1 block text-sm text-gray-400">邮箱账号（不可在此修改）</label>
        <input
          type="email"
          value={userEmail}
          disabled
          className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-gray-500 cursor-not-allowed"
        />
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm text-gray-300">
          姓名 <span className="text-red-400">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm text-gray-300">
          手机号码
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone ?? ''}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="gender" className="mb-1 block text-sm text-gray-300">
          性别
        </label>
        <select
          id="gender"
          name="gender"
          value={formData.gender ?? ''}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">请选择</option>
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">其他</option>
        </select>
      </div>

      {/* Birth date */}
      <div>
        <label htmlFor="birth_date" className="mb-1 block text-sm text-gray-300">
          出生日期
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          value={formData.birth_date ?? ''}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.birth_date && <p className="mt-1 text-xs text-red-400">{errors.birth_date}</p>}
      </div>

      {/* Height / Weight row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="height_cm" className="mb-1 block text-sm text-gray-300">
            身高（cm）
          </label>
          <input
            id="height_cm"
            name="height_cm"
            type="number"
            min="50"
            max="250"
            value={formData.height_cm ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="weight_kg" className="mb-1 block text-sm text-gray-300">
            体重（kg）
          </label>
          <input
            id="weight_kg"
            name="weight_kg"
            type="number"
            min="10"
            max="200"
            step="0.1"
            value={formData.weight_kg ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Server error / success */}
      {serverError && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
          ✅ 资料已全面同步更新至后端
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '正在安全执行...' : '保存修改 (Server Action)'}
      </button>
    </form>
  )
}

ProfileForm.displayName = 'ProfileForm'
