import vine from '@vinejs/vine'

export const sendMessageValidator = vine.compile(
  vine.object({
    message: vine.string().trim().maxLength(2000).optional(),
    attachment_type: vine.enum(['image', 'document'] as const).optional(),
  })
)
