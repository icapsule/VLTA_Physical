'use client'

import { useState } from 'react'

type Athlete = {
  id: string
  full_name: string
  avatar_url: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  phone: string | null
  gender: 'male' | 'female' | 'other' | null
}

type SortOption = 'name_asc' | 'name_desc' | 'age_asc' | 'age_desc' | 'height_desc'

export default function AthleteList({ initialAthletes }: { initialAthletes: Athlete[] }) {
  const [sortBy, setSortBy] = useState<SortOption>('name_asc')

  const sortedAthletes = [...initialAthletes].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return a.full_name.localeCompare(b.full_name)
    }
    if (sortBy === 'name_desc') {
      return b.full_name.localeCompare(a.full_name)
    }
    if (sortBy === 'age_asc') {
      // Younger first = larger birth_date string
      const dateA = a.birth_date || '1900-01-01'
      const dateB = b.birth_date || '1900-01-01'
      return dateB.localeCompare(dateA)
    }
    if (sortBy === 'age_desc') {
      // Older first = smaller birth_date string
      const dateA = a.birth_date || '9999-12-31'
      const dateB = b.birth_date || '9999-12-31'
      return dateA.localeCompare(dateB)
    }
    if (sortBy === 'height_desc') {
      const hA = a.height_cm || 0
      const hB = b.height_cm || 0
      return hB - hA
    }
    return 0
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">学员管理</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{initialAthletes.length} 名学员</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="name_asc">姓名 (A-Z)</option>
            <option value="name_desc">姓名 (Z-A)</option>
            <option value="age_asc">年龄 (由小到大)</option>
            <option value="age_desc">年龄 (由大到小)</option>
            <option value="height_desc">身高 (由高到低)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedAthletes.map((athlete) => (
          <a
            key={athlete.id}
            href={`/coach/athletes/${athlete.id}`}
            className="block rounded-2xl border border-gray-800 bg-gray-900 p-5 transition-colors hover:border-indigo-700 hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-700">
                {athlete.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={athlete.avatar_url} alt={`${athlete.full_name}的头像`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white flex items-center gap-1">
                  {athlete.full_name}
                  {athlete.gender === 'male' && <span className="text-blue-400 text-xs">♂</span>}
                  {athlete.gender === 'female' && <span className="text-pink-400 text-xs">♀</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {athlete.birth_date
                    ? `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁 (${athlete.birth_date})`
                    : '年龄未知'}
                  {athlete.height_cm ? ` · ${athlete.height_cm}cm` : ''}
                </p>
              </div>
            </div>
          </a>
        ))}
        {sortedAthletes.length === 0 && (
          <div className="col-span-3 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
             暂无学员
          </div>
        )}
      </div>
    </div>
  )
}
