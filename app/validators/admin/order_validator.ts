import vine from '@vinejs/vine'

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['new', 'pending', 'delivered', 'cancelled'] as const),
  })
)
