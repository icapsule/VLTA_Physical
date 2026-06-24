import { z } from 'zod'

export const TestMetricResultSchema = z.object({
  metric_id: z.string(),
  attempts: z.array(z.number()).optional(),
  is_passed: z.boolean().optional(),
})

export const CreateAssessmentSchema = z.object({
  athlete_id: z.string(),
  test_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: '无效的测试日期',
  }),
  results: z.array(TestMetricResultSchema),
})

export type CreateAssessmentFormValues = z.infer<typeof CreateAssessmentSchema>
export type TestMetricResult = z.infer<typeof TestMetricResultSchema>
