import vine from '@vinejs/vine'

export const createEnquiryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
    email: vine.string().email().normalizeEmail().optional(),
    subject: vine.string().trim().maxLength(255),
    message: vine.string().trim(),
  })
)
