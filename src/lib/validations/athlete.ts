import { z } from 'zod'

export const VirtualAthleteSchema = z.object({
  full_name: z.string().min(2, { message: '姓名至少需要 2 个字符' }).max(50),
  gender: z.enum(['male', 'female', 'other'], {
    message: '请选择性别',
  }),
  birth_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '无效的出生日期',
  }),
  height_cm: z.number().min(100).max(250).optional().or(z.literal('')),
  weight_kg: z.number().min(20).max(200).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
})

export type VirtualAthleteFormValues = z.infer<typeof VirtualAthleteSchema>
