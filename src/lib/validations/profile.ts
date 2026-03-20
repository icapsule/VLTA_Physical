import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable().or(z.literal('')),
  birth_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  height_cm: z.coerce.number().min(50).max(250).optional().nullable().or(z.literal('')),
  weight_kg: z.coerce.number().min(10).max(200).optional().nullable().or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileSchema>
