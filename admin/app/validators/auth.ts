import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    uid: vine.string().trim().minLength(1),
    password: vine.string().minLength(1),
    remember_me: vine.boolean().optional(),
  })
)

export const setupValidator = vine.compile(
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
  })
)
