import { z } from 'zod'

export const testEntrySchema = z.object({
  athleteId: z.string().min(1, '未绑定学员 ID'),
  test_date: z
    .string()
    .min(1)
    .refine((d) => new Date(d) <= new Date(), '测试日期不能是未来日期'),
  entries: z.array(
    z.object({
      test_item_id: z.number(),
      result_value: z.string(),
      notes: z.string().optional(),
    })
  ).min(1, '至少填写一项测试成绩'),
})

export type TestEntryFormData = z.infer<typeof testEntrySchema>
