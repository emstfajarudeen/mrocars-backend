import type { HttpContext } from '@adonisjs/core/http'
import CarModel from '#models/car_model'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import {
  applySearch,
  buildPaginationMeta,
  countRelated,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import { carModelValidator } from '#validators/admin/masters_validator'

const SEARCH_COLUMNS = ['name']

export default class CarModelController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const carBrandId = request.input('car_brand_id')

    const query = CarModel.query().preload('carBrand').orderBy('name', 'asc')

    if (carBrandId) {
      query.where('carBrandId', carBrandId)
    }

    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((m) => m.serialize()),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(carModelValidator)
      const model = await CarModel.create({
        carBrandId: payload.car_brand_id,
        name: payload.name,
        isActive: payload.is_active ?? true,
      })

      await model.load('carBrand')

      return ApiResponse.success(
        response,
        { car_model: model.serialize() },
        'Car model created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const model = await CarModel.query().where('id', params.id).preload('carBrand').first()

    if (!model) {
      return ApiResponse.error(response, 'Car model not found', undefined, 404)
    }

    return ApiResponse.success(response, { car_model: model.serialize() })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const model = await CarModel.find(params.id)
      if (!model) {
        return ApiResponse.error(response, 'Car model not found', undefined, 404)
      }

      const payload = await request.validateUsing(carModelValidator)
      model.carBrandId = payload.car_brand_id
      model.name = payload.name
      if (payload.is_active !== undefined) model.isActive = payload.is_active
      await model.save()
      await model.load('carBrand')

      return ApiResponse.success(
        response,
        { car_model: model.serialize() },
        'Car model updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const model = await CarModel.find(params.id)
    if (!model) {
      return ApiResponse.error(response, 'Car model not found', undefined, 404)
    }

    if ((await countRelated(UserVehicle.query(), 'carModelId', model.id)) > 0) {
      return ApiResponse.error(response, 'Cannot delete, has related records', undefined, 422)
    }

    await model.delete()
    return ApiResponse.success(response, {}, 'Car model deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const model = await CarModel.find(params.id)
    if (!model) {
      return ApiResponse.error(response, 'Car model not found', undefined, 404)
    }

    model.isActive = !model.isActive
    await model.save()

    return ApiResponse.success(
      response,
      { car_model: model.serialize() },
      'Car model status updated'
    )
  }
}
