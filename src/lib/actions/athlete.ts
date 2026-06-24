'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { VirtualAthleteSchema, type VirtualAthleteFormValues } from '@/lib/validations/athlete'

export async function createVirtualAthlete(formData: VirtualAthleteFormValues) {
  const { userId } = await auth()
  
  if (!userId) {
    return { error: '未授权的访问' }
  }

  const parsed = VirtualAthleteSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: '数据格式验证失败' }
  }

  const supabase = await createClient()

  // Verify the caller is an admin or coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'coach')) {
    return { error: '权限不足：仅教练和管理员可以创建虚拟学员' }
  }

  // Generate a random ID for the virtual athlete
  const virtualAthleteId = `virt_${crypto.randomUUID()}`

  // Insert virtual athlete
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: virtualAthleteId,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      gender: parsed.data.gender || null,
      birth_date: parsed.data.birth_date || null,
      height_cm: parsed.data.height_cm ? Number(parsed.data.height_cm) : null,
      weight_kg: parsed.data.weight_kg ? Number(parsed.data.weight_kg) : null,
      role: 'athlete',
    })

  if (insertError) {
    console.error('[Action] Create virtual athlete error:', insertError)
    return { error: '创建学员档案失败，请稍后重试' }
  }

  // Link the athlete to the coach/admin who created it
  const { error: assignError } = await supabase
    .from('coach_athlete_assignments')
    .insert({
      coach_id: userId,
      athlete_id: virtualAthleteId,
    })

  if (assignError) {
    console.error('[Action] Assign virtual athlete error:', assignError)
    // Non-fatal, but worth logging
  }

  return { success: true, athleteId: virtualAthleteId }
}
