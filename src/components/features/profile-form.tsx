'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import type { Profile } from '@/lib/supabase/types'

const profileSchema = z.object({
  full_name: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birth_date: z
    .string()
    .optional()
    .refine((d) => {
      if (!d) return true
      const age = new Date().getFullYear() - new Date(d).getFullYear()
      return age >= 8 && age <= 25
    }, '年龄必须在 8-25 岁之间'),
  height_cm: z.coerce.number().min(50).max(250).optional().or(z.literal('')),
  weight_kg: z.coerce.number().min(10).max(200).optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: Profile | null
  userEmail: string
  userId: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png']
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

/**
 * ProfileForm — client component for editing athlete profile and uploading avatar.
 */
export default function ProfileForm({ profile, userEmail, userId }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    gender: profile?.gender ?? undefined,
    birth_date: profile?.birth_date ?? '',
    height_cm: profile?.height_cm ?? '',
    weight_kg: profile?.weight_kg ?? '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, [name]: undefined }))
      setSuccess(false)
    },
    []
  )

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!ALLOWED_TYPES.includes(file.type)) {
        setServerError('仅支持 JPG / PNG 格式的图片')
        return
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setServerError('图片大小不能超过 2MB')
        return
      }

      setLoading(true)
      setServerError(null)
      const supabase = createClient()

      try {
        const filePath = `${userId}/avatar.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId)

        if (updateError) throw updateError

        setAvatarPreview(publicUrl)
        setSuccess(true)
      } catch (err) {
        const e = err as { message: string }
        setServerError(e.message ?? '上传失败')
      } finally {
        setLoading(false)
      }
    },
    [userId]
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

      const supabase = createClient()

      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: parsed.data.full_name,
            phone: parsed.data.phone ?? null,
            gender: parsed.data.gender ?? null,
            birth_date: parsed.data.birth_date || null,
            height_cm: parsed.data.height_cm ? Number(parsed.data.height_cm) : null,
            weight_kg: parsed.data.weight_kg ? Number(parsed.data.weight_kg) : null,
          })
          .eq('id', userId)

        if (updateError) throw updateError
        setSuccess(true)
      } catch (err) {
        const e = err as { message: string }
        setServerError(e.message ?? '保存失败，请重试')
      } finally {
        setLoading(false)
      }
    },
    [formData, userId]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-700 ring-2 ring-gray-600 transition hover:ring-indigo-500"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="上传头像"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="头像" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            更换头像
          </button>
          <p className="mt-0.5 text-xs text-gray-500">JPG / PNG，最大 2MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleAvatarChange}
          aria-label="选择头像文件"
        />
      </div>

      {/* Read-only email */}
      <div>
        <label className="mb-1 block text-sm text-gray-400">邮箱（不可修改）</label>
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
          ✅ 资料已更新
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '保存中...' : '保存修改'}
      </button>
    </form>
  )
}

ProfileForm.displayName = 'ProfileForm'
