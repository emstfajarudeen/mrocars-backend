import vine from '@vinejs/vine'

export const createAddressValidator = vine.compile(
  vine.object({
    label: vine.string(),
    governorate_id: vine.number(),
    area_id: vine.number(),
    block: vine.string(),
    street: vine.string(),
    property_type: vine.enum(['house', 'building']),
    house_no: vine.string().optional(),
    building_name: vine.string().optional(),
    building_no: vine.string().optional(),
    floor_no: vine.string().optional(),
    door_no: vine.string().optional(),
    latitude: vine.number().decimal([0, 8]).optional(),
    longitude: vine.number().decimal([0, 8]).optional(),
  })
)

export const updateAddressValidator = vine.compile(
  vine.object({
    label: vine.string().optional(),
    governorate_id: vine.number().optional(),
    area_id: vine.number().optional(),
    block: vine.string().optional(),
    street: vine.string().optional(),
    property_type: vine.enum(['house', 'building']).optional(),
    house_no: vine.string().optional(),
    building_name: vine.string().optional(),
    building_no: vine.string().optional(),
    floor_no: vine.string().optional(),
    door_no: vine.string().optional(),
    latitude: vine.number().decimal([0, 8]).optional(),
    longitude: vine.number().decimal([0, 8]).optional(),
  })
)
