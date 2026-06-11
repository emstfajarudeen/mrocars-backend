import type { HttpContext } from '@adonisjs/core/http'
import Governorate from '#models/governorate'
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
import { governorateValidator } from '#validators/admin/masters_validator'

const SEARCH_COLUMNS = ['nameEn', 'nameAr']

export default class GovernorateController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Governorate.query().withCount('areas').orderBy('nameEn', 'asc')
    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((g) => ({
        ...g.serialize(),
        areas_count: Number(g.$extras.areas_count),
      })),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(governorateValidator)
      const governorate = await Governorate.create({
        nameEn: payload.name_en,
        nameAr: payload.name_ar || payload.name_en,
        isActive: payload.is_active ?? true,
      })

      return ApiResponse.success(
        response,
        { governorate: governorate.serialize() },
        'Governorate created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const governorate = await Governorate.query()
      .where('id', params.id)
      .preload('areas', (q) => q.orderBy('nameEn', 'asc'))
      .first()

    if (!governorate) {
      return ApiResponse.error(response, 'Governorate not found', undefined, 404)
    }

    return ApiResponse.success(response, {
      governorate: {
        ...governorate.serialize(),
        areas: governorate.areas.map((a) => a.serialize()),
      },
    })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const governorate = await Governorate.find(params.id)
      if (!governorate) {
        return ApiResponse.error(response, 'Governorate not found', undefined, 404)
      }

      const payload = await request.validateUsing(governorateValidator)
      governorate.nameEn = payload.name_en
      governorate.nameAr = payload.name_ar || payload.name_en
      if (payload.is_active !== undefined) governorate.isActive = payload.is_active
      await governorate.save()

      return ApiResponse.success(
        response,
        { governorate: governorate.serialize() },
        'Governorate updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const governorate = await Governorate.find(params.id)
    if (!governorate) {
      return ApiResponse.error(response, 'Governorate not found', undefined, 404)
    }

    const hasRelations =
      (await countRelated(Area.query(), 'governorateId', governorate.id)) > 0 ||
      (await countRelated(UserAddress.query(), 'governorateId', governorate.id)) > 0 ||
      (await countRelated(BusinessProfile.query(), 'governorateId', governorate.id)) > 0

    if (hasRelations) {
      return ApiResponse.error(response, 'Cannot delete, has related records', undefined, 422)
    }

    await governorate.delete()
    return ApiResponse.success(response, {}, 'Governorate deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const governorate = await Governorate.find(params.id)
    if (!governorate) {
      return ApiResponse.error(response, 'Governorate not found', undefined, 404)
    }

    governorate.isActive = !governorate.isActive
    await governorate.save()

    return ApiResponse.success(
      response,
      { governorate: governorate.serialize() },
      'Governorate status updated'
    )
  }
}
