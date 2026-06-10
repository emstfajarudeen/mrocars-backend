import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone_code: vine.string().optional(),
    phone_number: vine.string().optional(),
    language: vine.enum(['en', 'ar']).optional(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    old_password: vine.string(),
    new_password: vine.string().minLength(8).confirmed({
      confirmationField: 'new_password_confirmation',
    }),
    new_password_confirmation: vine.string(),
  })
)

export const languageValidator = vine.compile(
  vine.object({
    language: vine.enum(['en', 'ar']),
  })
)
