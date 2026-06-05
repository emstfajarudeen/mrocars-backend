import type { HttpContext } from '@adonisjs/core/http'
import CarBrand from '#models/car_brand'
import CarModel from '#models/car_model'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, storeFile, validateImageFile } from '#helpers/upload'
import {
  applySearch,
  buildPaginationMeta,
  countRelated,
  getPaginationParams,
  isValidationError,
  serializeCarBrand,
} from '#helpers/masters'
import { carBrandValidator } from '#validators/admin/masters_validator'

const SEARCH_COLUMNS = ['name']

export default class CarBrandController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = CarBrand.query().withCount('models').orderBy('name', 'asc')
    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((b) => ({
        ...serializeCarBrand(b),
        models_count: Number(b.$extras.models_count),
      })),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(carBrandValidator)
      const logo = request.file('logo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(logo, 'logo', false)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      let logoPath: string | null = null
      if (logo) {
        logoPath = await storeFile(logo, 'car-brands')
      }

      const brand = await CarBrand.create({
        name: payload.name,
        logo: logoPath,
        isActive: payload.is_active ?? true,
      })

      return ApiResponse.success(
        response,
        { car_brand: serializeCarBrand(brand) },
        'Car brand created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const brand = await CarBrand.query()
      .where('id', params.id)
      .preload('models', (q) => q.orderBy('name', 'asc'))
      .first()

    if (!brand) {
      return ApiResponse.error(response, 'Car brand not found', undefined, 404)
    }

    return ApiResponse.success(response, {
      car_brand: {
        ...serializeCarBrand(brand),
        models: brand.models.map((m) => m.serialize()),
      },
    })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const brand = await CarBrand.find(params.id)
      if (!brand) {
        return ApiResponse.error(response, 'Car brand not found', undefined, 404)
      }

      const payload = await request.validateUsing(carBrandValidator)
      const logo = request.file('logo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(logo, 'logo', false)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      brand.name = payload.name
      if (payload.is_active !== undefined) brand.isActive = payload.is_active

      if (logo) {
        await deleteFileIfExists(brand.logo)
        brand.logo = await storeFile(logo, 'car-brands')
      }

      await brand.save()

      return ApiResponse.success(
        response,
        { car_brand: serializeCarBrand(brand) },
        'Car brand updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const brand = await CarBrand.find(params.id)
    if (!brand) {
      return ApiResponse.error(response, 'Car brand not found', undefined, 404)
    }

    const hasRelations =
      (await countRelated(CarModel.query(), 'carBrandId', brand.id)) > 0 ||
      (await countRelated(UserVehicle.query(), 'carBrandId', brand.id)) > 0

    if (hasRelations) {
      return ApiResponse.error(response, 'Cannot delete, has related records', undefined, 422)
    }

    await deleteFileIfExists(brand.logo)
    await brand.delete()

    return ApiResponse.success(response, {}, 'Car brand deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const brand = await CarBrand.find(params.id)
    if (!brand) {
      return ApiResponse.error(response, 'Car brand not found', undefined, 404)
    }

    brand.isActive = !brand.isActive
    await brand.save()

    return ApiResponse.success(
      response,
      { car_brand: serializeCarBrand(brand) },
      'Car brand status updated'
    )
  }
}
