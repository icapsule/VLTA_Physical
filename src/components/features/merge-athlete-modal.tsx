'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mergeAthletes } from '@/app/admin/actions'
import type { Profile } from '@/lib/supabase/types'

interface MergeAthleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  virtualUser: Profile | null
}

export function MergeAthleteModal({ isOpen, onClose, onSuccess, virtualUser }: MergeAthleteModalProps) {
  const [realUsers, setRealUsers] = useState<Profile[]>([])
  const [selectedRealId, setSelectedRealId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (isOpen && virtualUser) {
      // Fetch all non-virtual users (e.g. ids starting with user_ or simply all athletes that aren't virt_)
      const fetchRealUsers = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .not('id', 'like', 'virt_%')
          .order('created_at', { ascending: false })
        
        if (data) {
          setRealUsers(data as Profile[])
        }
      }
      fetchRealUsers()
      setSelectedRealId('')
      setError(null)
    }
  }, [isOpen, virtualUser, supabase])

  if (!isOpen || !virtualUser) return null

  const handleMerge = async () => {
    if (!selectedRealId) {
      setError('请选择一个目标真实账号')
      return
    }

    setLoading(true)
    setError(null)
    
    const result = await mergeAthletes(virtualUser.id, selectedRealId)
    
    setLoading(false)
    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setError(result.error || '合并失败')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-white">关联真实账号</h2>
        <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800/50 p-3 text-sm text-red-400">
          <p className="font-semibold mb-1">⚠️ 注意：</p>
          <p>将虚拟账号 <strong>{virtualUser.full_name}</strong> 的所有体测、计划数据无损转移给选定的真实账号。合并后该虚拟账号将被删除！</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">选择目标真实账号</label>
            <select
              value={selectedRealId}
              onChange={(e) => setSelectedRealId(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
              disabled={loading}
            >
              <option value="" disabled>-- 请选择 --</option>
              {realUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} (ID: {u.id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleMerge}
              disabled={loading || !selectedRealId}
              className="rounded-xl bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '合并中...' : '确认合并'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
