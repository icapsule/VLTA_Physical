'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { profileSchema, type ProfileFormData } from '@/lib/validations/profile'

export async function updateProfile(formData: ProfileFormData) {
  // 1. 获取最权威的 Clerk 后端鉴权 ID (防伪造)
  const { userId } = await auth()
  
  if (!userId) {
    return { error: '未授权的访问' }
  }

  // 2. 先期剥离执行 Zod 安全校验防击穿
  const parsed = profileSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: '数据格式验证失败' }
  }

  const supabase = await createClient()

  // 3. 服务端安全执行写入 (完全不依赖 RLS)
  // 因为使用了 .eq('id', userId)，只有用户本人的数据列能被更新，等效于 RLS 安全性。
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      gender: parsed.data.gender || null,
      birth_date: parsed.data.birth_date || null,
      height_cm: parsed.data.height_cm ? Number(parsed.data.height_cm) : null,
      weight_kg: parsed.data.weight_kg ? Number(parsed.data.weight_kg) : null,
    })
    .eq('id', userId)

  if (error) {
    console.error('[Action] Profile update error:', error)
    return { error: '系统异常：保存失败，请稍后重试' }
  }

  return { success: true }
}
