import vine from '@vinejs/vine'

export const createVehicleValidator = vine.compile(
  vine.object({
    car_brand_id: vine.number(),
    car_model_id: vine.number(),
    year: vine.string(),
    registration_number: vine.string().optional(),
    vin_number: vine.string().optional(),
  })
)

export const updateVehicleValidator = vine.compile(
  vine.object({
    car_brand_id: vine.number().optional(),
    car_model_id: vine.number().optional(),
    year: vine.string().optional(),
    registration_number: vine.string().optional(),
    vin_number: vine.string().optional(),
  })
)
