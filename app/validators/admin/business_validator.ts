import vine from '@vinejs/vine'

export const createBusinessValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    email: vine.string().email(),
    phone_code: vine.string().trim(),
    phone_number: vine.string().trim(),
    password: vine.string().minLength(8),
    business_name: vine.string().trim(),
    is_approved: vine.boolean().optional(),
  })
)

export const updateBusinessValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
    email: vine.string().email().optional(),
    phone_code: vine.string().trim().optional(),
    phone_number: vine.string().trim().optional(),
    business_name: vine.string().trim().optional(),
    is_approved: vine.boolean().optional(),
  })
)
