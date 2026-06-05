import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
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
