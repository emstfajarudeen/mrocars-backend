import vine from '@vinejs/vine'

export const createResponseValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
    price: vine.number().min(0),
    offer_validity_type: vine.enum(['date', 'open'] as const),
    offer_valid_until: vine.date().optional(),
  })
)

export const updateResponseValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().optional(),
    price: vine.number().min(0).optional(),
    offer_validity_type: vine.enum(['date', 'open'] as const).optional(),
    offer_valid_until: vine.date().optional(),
  })
)
