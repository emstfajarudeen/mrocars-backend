import type { HttpContext } from '@adonisjs/core/http'
import Area from '#models/area'
import UserAddress from '#models/user_address'
import BusinessProfile from '#models/business_profile'
import { ApiResponse } from '#helpers/response'
import {
  applySearch,
  buildPaginationMeta,
  countRelated,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import { areaValidator } from '#validators/admin/masters_validator'

const SEARCH_COLUMNS = ['nameEn', 'nameAr']

export default class AreaController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const governorateId = request.input('governorate_id')

    const query = Area.query().preload('governorate').orderBy('nameEn', 'asc')

    if (governorateId) {
      query.where('governorateId', governorateId)
    }

    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((a) => a.serialize()),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(areaValidator)
      const area = await Area.create({
        governorateId: payload.governorate_id,
        nameEn: payload.name_en,
        nameAr: payload.name_ar || payload.name_en,
        isActive: payload.is_active ?? true,
      })

      await area.load('governorate')

      return ApiResponse.success(
        response,
        { area: area.serialize() },
        'Area created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const area = await Area.query().where('id', params.id).preload('governorate').first()

    if (!area) {
      return ApiResponse.error(response, 'Area not found', undefined, 404)
    }

    return ApiResponse.success(response, { area: area.serialize() })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const area = await Area.find(params.id)
      if (!area) {
        return ApiResponse.error(response, 'Area not found', undefined, 404)
      }

      const payload = await request.validateUsing(areaValidator)
      area.governorateId = payload.governorate_id
      area.nameEn = payload.name_en
      area.nameAr = payload.name_ar || payload.name_en
      if (payload.is_active !== undefined) area.isActive = payload.is_active
      await area.save()
      await area.load('governorate')

      return ApiResponse.success(response, { area: area.serialize() }, 'Area updated successfully')
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const area = await Area.find(params.id)
    if (!area) {
      return ApiResponse.error(response, 'Area not found', undefined, 404)
    }

    const hasRelations =
      (await countRelated(UserAddress.query(), 'areaId', area.id)) > 0 ||
      (await countRelated(BusinessProfile.query(), 'areaId', area.id)) > 0

    if (hasRelations) {
      return ApiResponse.error(response, 'Cannot delete, has related records', undefined, 422)
    }

    await area.delete()
    return ApiResponse.success(response, {}, 'Area deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const area = await Area.find(params.id)
    if (!area) {
      return ApiResponse.error(response, 'Area not found', undefined, 404)
    }

    area.isActive = !area.isActive
    await area.save()

    return ApiResponse.success(response, { area: area.serialize() }, 'Area status updated')
  }
}
