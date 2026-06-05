import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    request_response_id: vine.number(),
    delivery_address_id: vine.number(),
    payment_method: vine.enum(['knet', 'credit_card', 'apple_pay'] as const),
  })
)

export const rateOrderValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5),
  })
)

export const respondAdditionalWorkValidator = vine.compile(
  vine.object({
    action: vine.enum(['accept', 'reject'] as const),
  })
)
