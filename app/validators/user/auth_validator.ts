import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    email: vine.string().email(),
    phone_code: vine.string(),
    phone_number: vine.string(),
    password: vine.string().minLength(8).confirmed({
      confirmationField: 'password_confirmation',
    }),
    password_confirmation: vine.string(),
    language: vine.enum(['en', 'ar']).optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

export const verifyOtpValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    otp: vine.string().fixedLength(6),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    token: vine.string(),
    password: vine.string().minLength(8).confirmed({
      confirmationField: 'password_confirmation',
    }),
    password_confirmation: vine.string(),
  })
)

export const refreshTokenValidator = vine.compile(
  vine.object({
    refresh_token: vine.string(),
  })
)
