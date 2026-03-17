import vine from '@vinejs/vine'

export const downloadJobsByFiletypeSchema = vine.compile(
  vine.object({
    params: vine.object({
      filetype: vine.string(),
    }),
  })
)

export const modelNameSchema = vine.compile(
  vine.object({
    model: vine.string(),
  })
)

export const downloadJobIdSchema = vine.compile(
  vine.object({
    params: vine.object({
      jobId: vine.string(),
    }),
  })
)

export const downloadPrioritySchema = vine.compile(
  vine.object({
    params: vine.object({
      jobId: vine.string(),
    }),
    priority: vine.number().min(1).max(100),
  })
)
