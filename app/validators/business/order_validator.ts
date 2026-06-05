import vine from '@vinejs/vine'

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'delivered'] as const),
  })
)

export const createAdditionalWorkValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
    price: vine.number().min(0),
  })
)

export const updateAdditionalWorkValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
    price: vine.number().min(0).optional(),
  })
)
