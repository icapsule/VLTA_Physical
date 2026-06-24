'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'

interface EditUserProfileModalProps {
  isOpen: boolean
  user: Profile | null
  onClose: () => void
  onSuccess: () => void
}

export function EditUserProfileModal({ isOpen, user, onClose, onSuccess }: EditUserProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '' as Profile['gender'] | '',
    birth_date: '',
    height_cm: '',
    weight_kg: '',
    phone: '',
  })

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        gender: user.gender || '',
        birth_date: user.birth_date || '',
        height_cm: user.height_cm ? String(user.height_cm) : '',
        weight_kg: user.weight_kg ? String(user.weight_kg) : '',
        phone: user.phone || '',
      })
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const updates = {
      full_name: formData.full_name,
      gender: formData.gender || null,
      birth_date: formData.birth_date || null,
      height_cm: formData.height_cm ? Number(formData.height_cm) : null,
      weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
      phone: formData.phone || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">编辑用户资料</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">姓名 (Full Name)</label>
            <input
              required
              type="text"
              value={formData.full_name}
              onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">性别 (Gender)</label>
              <select
                value={formData.gender || ''}
                onChange={e => setFormData(p => ({ ...p, gender: e.target.value as any }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">未设置</option>
                <option value="male">男 (Male)</option>
                <option value="female">女 (Female)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">出生日期 (Birth Date)</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={e => setFormData(p => ({ ...p, birth_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">身高 (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.height_cm}
                onChange={e => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={e => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">联系电话 (Phone)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存更改'}
            </button>
          </div>
          
          <div className="mt-2 text-center">
            <a 
              href={`/coach/athletes/${user.id}`} 
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              前往 {user.full_name} 的详细仪表盘 →
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
