import vine from '@vinejs/vine'

export const bannerValidator = vine.compile(
  vine.object({
    title_en: vine.string(),
    title_ar: vine.string().optional(),
    description_en: vine.string().optional(),
    description_ar: vine.string().optional(),
    sort_order: vine.number().optional(),
    is_active: vine.boolean().optional(),
  })
)

export const bannerReorderValidator = vine.compile(
  vine.object({
    items: vine.array(
      vine.object({
        id: vine.number(),
        sort_order: vine.number(),
      })
    ),
  })
)
