import type { TestResult } from '@/lib/supabase/types'

type RecentTest = TestResult & {
  test_items: { name: string; unit: string } | null
}

interface RecentTestsCardProps {
  tests: RecentTest[]
}

/**
 * RecentTestsCard — Server Component snippet extracted for the athlete dashboard.
 * Displays the latest test results.
 */
export default function RecentTestsCard({ tests }: RecentTestsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:col-span-1">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        最近测试成绩
      </h2>
      {tests.length === 0 ? (
        <p className="text-sm text-gray-500">暂无测试记录</p>
      ) : (
        <ul className="space-y-3">
          {tests.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">
                {r.test_items?.name ?? '未知项目'}
              </span>
              <span className="font-mono text-sm font-semibold text-indigo-400">
                {r.result_value} {r.test_items?.unit ?? ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <a
        href="/tests"
        className="mt-4 block text-center text-xs text-indigo-400 hover:text-indigo-300"
      >
        查看全部 →
      </a>
    </div>
  )
}
