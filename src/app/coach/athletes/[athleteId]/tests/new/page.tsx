import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BulkTestEntryForm from '@/components/features/bulk-test-entry-form'

interface NewTestPageProps {
  params: Promise<{ athleteId: string }>
}

/**
 * New test entry page — wraps BulkTestEntryForm with server-side data fetching.
 */
export default async function NewTestPage({ params }: NewTestPageProps) {
  const { athleteId } = await params
  const supabase = await createClient()

  const { userId } = await auth()
  const user = userId ? { id: userId } : null

  if (!user) redirect('/sign-in')

  const [{ data: athlete }, { data: testItems }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', athleteId)
      .eq('role', 'athlete')
      .single(),
    supabase
      .from('test_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (!athlete) notFound()

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/coach/athletes/${athleteId}`}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          ← 返回学员详情
        </a>
        <h1 className="mt-2 text-2xl font-bold text-white">录入体能测试成绩</h1>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <BulkTestEntryForm
          athleteId={athlete.id}
          athleteName={athlete.full_name}
          testItems={testItems ?? []}
          coachId={user.id}
        />
      </div>
    </div>
  )
}
