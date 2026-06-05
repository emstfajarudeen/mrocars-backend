import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
    business_name: vine.string().trim().optional(),
    email: vine.string().email().optional(),
    phone_code: vine.string().optional(),
    phone_number: vine.string().optional(),
  })
)

export const businessAddressValidator = vine.compile(
  vine.object({
    governorate_id: vine.number().optional(),
    area_id: vine.number().optional(),
    block: vine.string().optional(),
    street: vine.string().optional(),
    building_name: vine.string().optional(),
    building_no: vine.string().optional(),
    floor_no: vine.string().optional(),
    shop_no: vine.string().optional(),
    latitude: vine.number().decimal([0, 8]).optional(),
    longitude: vine.number().decimal([0, 8]).optional(),
  })
)

export const bankDetailsValidator = vine.compile(
  vine.object({
    bank_name: vine.string(),
    account_name: vine.string(),
    iban: vine.string(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    old_password: vine.string(),
    new_password: vine.string().minLength(8).confirmed({
      confirmationField: 'new_password_confirmation',
    }),
    new_password_confirmation: vine.string(),
  })
)

export const languageValidator = vine.compile(
  vine.object({
    language: vine.enum(['en', 'ar']),
  })
)
