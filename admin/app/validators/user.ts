import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(100)
      .alphaNumeric({ allowDashes: true, allowUnderscores: true }),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    full_name: vine.string().trim().maxLength(255).optional(),
    role: vine.enum(['admin', 'operator', 'viewer']),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    full_name: vine.string().trim().maxLength(255).optional(),
    role: vine.enum(['admin', 'operator', 'viewer']).optional(),
    is_active: vine.boolean().optional(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(8),
  })
)
