import vine from '@vinejs/vine'

export const createRequestValidator = vine.compile(
  vine.object({
    category_id: vine.number(),
    user_vehicle_id: vine.number().optional(),
    title: vine.string().trim().maxLength(255),
    description: vine.string().trim().optional(),
    spare_part_type: vine.string().trim().optional(),
    no_of_tyres: vine.number().min(1).optional(),
    when_needed: vine.enum(['now', 'later'] as const).optional(),
    scheduled_date: vine.date().optional(),
    scheduled_time: vine.string().trim().optional(),
    pickup_location_name: vine.string().trim().optional(),
    pickup_latitude: vine.number().optional(),
    pickup_longitude: vine.number().optional(),
    delivery_location_name: vine.string().trim().optional(),
    delivery_latitude: vine.number().optional(),
    delivery_longitude: vine.number().optional(),
  })
)
