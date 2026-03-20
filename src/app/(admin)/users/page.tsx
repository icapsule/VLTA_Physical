'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/lib/supabase/types'

const ROLES: UserRole[] = ['athlete', 'coach', 'admin']

const ROLE_LABEL: Record<UserRole, string> = {
  athlete: '学员',
  coach: '教练',
  admin: '管理员',
}

const ROLE_COLOR: Record<UserRole, string> = {
  athlete: 'bg-blue-900/50 text-blue-400',
  coach: 'bg-purple-900/50 text-purple-400',
  admin: 'bg-yellow-900/50 text-yellow-400',
}

/**
 * Admin user management page — list all users and change their roles.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setUsers(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = useCallback(
    async (userId: string, newRole: UserRole) => {
      setUpdatingId(userId)
      setError(null)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (updateError) {
        setError(updateError.message)
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
        setSuccessId(userId)
        setTimeout(() => setSuccessId(null), 2000)
      }
      setUpdatingId(null)
    },
    [supabase]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">用户管理</h1>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700 bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  当前角色
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  修改角色
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  注册时间
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-800 transition-colors ${
                    successId === u.id ? 'bg-green-900/10' : 'hover:bg-gray-800/30'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role]}`}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as UserRole)
                      }
                      aria-label={`修改 ${u.full_name} 的角色`}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    {updatingId === u.id && (
                      <span className="ml-2 text-xs text-gray-500">更新中...</span>
                    )}
                    {successId === u.id && (
                      <span className="ml-2 text-xs text-green-400">✅</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

AdminUsersPage.displayName = 'AdminUsersPage'
