import type { HttpContext } from '@adonisjs/core/http'
import Governorate from '#models/governorate'
import Area from '#models/area'
import CarBrand from '#models/car_brand'
import CarModel from '#models/car_model'
import Category from '#models/category'
import { ApiResponse } from '#helpers/response'
import { serializeCarBrand, serializeCategory } from '#helpers/masters'

export default class MastersController {
  async governorates({ response }: HttpContext) {
    const governorates = await Governorate.query()
      .where('isActive', true)
      .orderBy('nameEn', 'asc')

    return ApiResponse.success(response, {
      governorates: governorates.map((g) => g.serialize()),
    })
  }

  async areas({ params, response }: HttpContext) {
    const areas = await Area.query()
      .where('governorateId', params.id)
      .where('isActive', true)
      .orderBy('nameEn', 'asc')

    return ApiResponse.success(response, {
      areas: areas.map((a) => a.serialize()),
    })
  }

  async carBrands({ response }: HttpContext) {
    const carBrands = await CarBrand.query()
      .where('isActive', true)
      .orderBy('name', 'asc')

    return ApiResponse.success(response, {
      car_brands: carBrands.map((b) => serializeCarBrand(b)),
    })
  }

  async carModels({ params, response }: HttpContext) {
    const carModels = await CarModel.query()
      .where('carBrandId', params.id)
      .where('isActive', true)
      .orderBy('name', 'asc')

    return ApiResponse.success(response, {
      car_models: carModels.map((m) => m.serialize()),
    })
  }

  async categories({ response }: HttpContext) {
    const categories = await Category.query()
      .where('isActive', true)
      .orderBy('sortOrder', 'asc')

    return ApiResponse.success(response, {
      categories: categories.map((c) => serializeCategory(c)),
    })
  }
}
