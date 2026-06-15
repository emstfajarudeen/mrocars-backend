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

    // Address Details
    address_label: vine.string().optional(),
    governorate_id: vine.number().optional(),
    area_id: vine.number().optional(),
    block: vine.string().optional(),
    street: vine.string().optional(),
    building_name: vine.string().optional(),
    building_no: vine.string().optional(),
    floor_no: vine.string().optional(),
    shop_no: vine.string().optional(),
    latitude: vine.number().optional(),
    longitude: vine.number().optional(),

    // Bank Details
    bank_name: vine.string().optional(),
    account_name: vine.string().optional(),
    iban: vine.string().optional(),
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
