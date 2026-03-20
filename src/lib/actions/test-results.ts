'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { testEntrySchema, type TestEntryFormData } from '@/lib/validations/test-results'

export async function bulkInsertTestResults(formData: TestEntryFormData) {
  // 1. 获取 Clerk 最高级鉴权
  const { userId } = await auth()
  
  if (!userId) {
    return { error: '未授权访问' }
  }

  // 2. 剥离式 Zod 包体审计
  const parsed = testEntrySchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '数据格式验证失败' }
  }

  const supabase = await createClient()

  // 3. 替代 RLS 权限判定：核实操作人必须为 coach 或 admin
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!myProfile || (myProfile.role !== 'coach' && myProfile.role !== 'admin')) {
      return { error: '越权拦截：仅教练和管理员可录入全局成绩' }
  }

  // 4. 重组装包体，强制锁死创建人为发起鉴权者 (防篡改)
  const inserts = parsed.data.entries.map((entry) => ({
    athlete_id: parsed.data.athleteId,
    test_item_id: entry.test_item_id,
    result_value: parseFloat(entry.result_value),
    test_date: parsed.data.test_date,
    notes: entry.notes || null,
    created_by: userId,
  }))

  const { error } = await supabase.from('test_results').insert(inserts)

  if (error) {
    console.error('[Action] Bulk insert error:', error)
    return { error: '系统异常：成绩云端写入崩塌，请稍后重试' }
  }

  return { success: true }
}
