import vine from '@vinejs/vine'

export const runBenchmarkValidator = vine.compile(
  vine.object({
    benchmark_type: vine.enum(['full', 'system', 'ai']).optional(),
  })
)

export const submitBenchmarkValidator = vine.compile(
  vine.object({
    benchmark_id: vine.string().optional(),
  })
)

export const updateBenchmarkSettingsValidator = vine.compile(
  vine.object({
    allow_anonymous_submission: vine.boolean().optional(),
  })
)

export const updateBuilderTagValidator = vine.compile(
  vine.object({
    benchmark_id: vine.string().trim().minLength(1),
    builder_tag: vine
      .string()
      .trim()
      .regex(/^[A-Za-z]+-[A-Za-z]+-\d{4}$/)
      .optional(),
  })
)
