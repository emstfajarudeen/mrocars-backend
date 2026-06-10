import vine from '@vinejs/vine'

export const governorateValidator = vine.compile(
  vine.object({
    name_en: vine.string(),
    name_ar: vine.string(),
    is_active: vine.boolean().optional(),
  })
)

export const areaValidator = vine.compile(
  vine.object({
    governorate_id: vine.number().exists({ table: 'governorates', column: 'id' }),
    name_en: vine.string(),
    name_ar: vine.string(),
    is_active: vine.boolean().optional(),
  })
)

export const carBrandValidator = vine.compile(
  vine.object({
    name: vine.string(),
    is_active: vine.boolean().optional(),
  })
)

export const carModelValidator = vine.compile(
  vine.object({
    car_brand_id: vine.number().exists({ table: 'car_brands', column: 'id' }),
    name: vine.string(),
    is_active: vine.boolean().optional(),
  })
)

export const categoryValidator = vine.compile(
  vine.object({
    name_en: vine.string(),
    name_ar: vine.string(),
    description_en: vine.string().optional(),
    description_ar: vine.string().optional(),
    sort_order: vine.number().optional(),
    is_active: vine.boolean().optional(),
  })
)

export const categoryReorderValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        id: vine.number(),
        sort_order: vine.number(),
      })
    ),
  })
)
