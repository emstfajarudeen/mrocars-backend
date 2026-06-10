import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, storeFile, validateImageFile } from '#helpers/upload'
import {
  applySearch,
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
  serializeBanner,
} from '#helpers/masters'
import { bannerReorderValidator, bannerValidator } from '#validators/admin/banner_validator'

const SEARCH_COLUMNS = ['titleEn', 'titleAr']

export default class BannerController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Banner.query().orderBy('sortOrder', 'asc')
    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((banner) => serializeBanner(banner)),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(bannerValidator)
      const image = request.file('image', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(image, 'image', true)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      const banner = await Banner.create({
        titleEn: payload.title_en,
        titleAr: payload.title_ar,
        descriptionEn: payload.description_en ?? null,
        descriptionAr: payload.description_ar ?? null,
        image: await storeFile(image!, 'banners'),
        sortOrder: payload.sort_order ?? 0,
        isActive: payload.is_active ?? true,
      })

      return ApiResponse.success(
        response,
        { banner: serializeBanner(banner) },
        'Banner created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return ApiResponse.error(response, 'Banner not found', undefined, 404)
    }

    return ApiResponse.success(response, { banner: serializeBanner(banner) })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const banner = await Banner.find(params.id)
      if (!banner) {
        return ApiResponse.error(response, 'Banner not found', undefined, 404)
      }

      const payload = await request.validateUsing(bannerValidator)
      const image = request.file('image', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(image, 'image', false)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      banner.titleEn = payload.title_en
      banner.titleAr = payload.title_ar
      banner.descriptionEn = payload.description_en ?? null
      banner.descriptionAr = payload.description_ar ?? null
      if (payload.sort_order !== undefined) banner.sortOrder = payload.sort_order
      if (payload.is_active !== undefined) banner.isActive = payload.is_active

      if (image) {
        await deleteFileIfExists(banner.image)
        banner.image = await storeFile(image, 'banners')
      }

      await banner.save()

      return ApiResponse.success(
        response,
        { banner: serializeBanner(banner) },
        'Banner updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return ApiResponse.error(response, 'Banner not found', undefined, 404)
    }

    await deleteFileIfExists(banner.image)
    await banner.delete()

    return ApiResponse.success(response, {}, 'Banner deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const banner = await Banner.find(params.id)
    if (!banner) {
      return ApiResponse.error(response, 'Banner not found', undefined, 404)
    }

    banner.isActive = !banner.isActive
    await banner.save()

    return ApiResponse.success(
      response,
      { banner: serializeBanner(banner) },
      'Banner status updated'
    )
  }

  async reorder({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(bannerReorderValidator)

      for (const item of payload.items) {
        await Banner.query().where('id', item.id).update({ sortOrder: item.sort_order })
      }

      const banners = await Banner.query().orderBy('sortOrder', 'asc')

      return ApiResponse.success(
        response,
        { banners: banners.map((banner) => serializeBanner(banner)) },
        'Banners reordered successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
