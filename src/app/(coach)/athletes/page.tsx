import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Coach athletes list page with search.
 */
export default async function AthletesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, birth_date, height_cm, weight_kg, phone')
    .eq('role', 'athlete')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">学员管理</h1>
        <span className="text-sm text-gray-400">{athletes?.length ?? 0} 名学员</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(athletes ?? []).map((athlete) => (
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
                <p className="font-semibold text-white">{athlete.full_name}</p>
                <p className="text-xs text-gray-400">
                  {athlete.birth_date
                    ? `${new Date().getFullYear() - new Date(athlete.birth_date).getFullYear()} 岁`
                    : '年龄未知'}
                  {athlete.height_cm ? ` · ${athlete.height_cm}cm` : ''}
                </p>
              </div>
            </div>
          </a>
        ))}
        {(athletes ?? []).length === 0 && (
          <div className="col-span-3 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
            暂无学员
          </div>
        )}
      </div>
    </div>
  )
}
