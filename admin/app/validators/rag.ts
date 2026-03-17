import vine from '@vinejs/vine'

export const getJobStatusSchema = vine.compile(
  vine.object({
    filePath: vine
      .string()
      .trim()
      .minLength(1)
      .regex(/^[^.\/\\]/) // Must not start with . / or \
      .regex(/^[a-zA-Z0-9._\-]+$/), // Only safe filename characters
  })
)

export const deleteFileSchema = vine.compile(
  vine.object({
    source: vine
      .string()
      .trim()
      .minLength(1)
      .regex(/^[a-zA-Z0-9]/) // Must start with alphanumeric
      .regex(/^(?!.*\.\.)[\w.\-/]+$/), // No .. sequences, safe characters only
  })
)
