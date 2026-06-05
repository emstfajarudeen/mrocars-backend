import type { HttpContext } from '@adonisjs/core/http'
import Area from '#models/area'
import CarBrand from '#models/car_brand'
import CarModel from '#models/car_model'
import Category from '#models/category'
import Governorate from '#models/governorate'
import {
  applySearch,
  buildPaginationMeta,
  getPaginationParams,
  serializeCarBrand,
  serializeCategory,
} from '#helpers/masters'

const CATEGORY_SEARCH_COLUMNS = ['nameEn', 'nameAr']
const CAR_BRAND_SEARCH_COLUMNS = ['name']
const CAR_MODEL_SEARCH_COLUMNS = ['name']
const GOVERNORATE_SEARCH_COLUMNS = ['nameEn', 'nameAr']
const AREA_SEARCH_COLUMNS = ['nameEn', 'nameAr']

export default class MastersController {
  async categories({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Category.query().orderBy('sortOrder', 'asc')
    applySearch(query, search, CATEGORY_SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return inertia.render('admin/masters/Categories', {
      categories: paginated.all().map((category) => serializeCategory(category)),
      meta: buildPaginationMeta(paginated),
      filters: { search: search ?? null },
    })
  }

  async carBrands({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = CarBrand.query().withCount('models').orderBy('name', 'asc')
    applySearch(query, search, CAR_BRAND_SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return inertia.render('admin/masters/CarBrands', {
      carBrands: paginated.all().map((brand) => ({
        ...serializeCarBrand(brand),
        models_count: Number(brand.$extras.models_count),
      })),
      meta: buildPaginationMeta(paginated),
      filters: { search: search ?? null },
    })
  }

  async carModels({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const carBrandId = request.input('car_brand_id')

    const query = CarModel.query().preload('carBrand').orderBy('name', 'asc')

    if (carBrandId) {
      query.where('carBrandId', carBrandId)
    }

    applySearch(query, search, CAR_MODEL_SEARCH_COLUMNS)

    const [paginated, carBrands] = await Promise.all([
      query.paginate(page, limit),
      CarBrand.query().orderBy('name', 'asc'),
    ])

    return inertia.render('admin/masters/CarModels', {
      carModels: paginated.all().map((model) => model.serialize()),
      carBrands: carBrands.map((brand) => brand.serialize()),
      meta: buildPaginationMeta(paginated),
      filters: {
        search: search ?? null,
        car_brand_id: carBrandId ? Number(carBrandId) : null,
      },
    })
  }

  async governorates({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Governorate.query().withCount('areas').orderBy('nameEn', 'asc')
    applySearch(query, search, GOVERNORATE_SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return inertia.render('admin/masters/Governorates', {
      governorates: paginated.all().map((governorate) => ({
        ...governorate.serialize(),
        areas_count: Number(governorate.$extras.areas_count),
      })),
      meta: buildPaginationMeta(paginated),
      filters: { search: search ?? null },
    })
  }

  async areas({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const governorateId = request.input('governorate_id')

    const query = Area.query().preload('governorate').orderBy('nameEn', 'asc')

    if (governorateId) {
      query.where('governorateId', governorateId)
    }

    applySearch(query, search, AREA_SEARCH_COLUMNS)

    const [paginated, governorates] = await Promise.all([
      query.paginate(page, limit),
      Governorate.query().orderBy('nameEn', 'asc'),
    ])

    return inertia.render('admin/masters/Areas', {
      areas: paginated.all().map((area) => area.serialize()),
      governorates: governorates.map((governorate) => governorate.serialize()),
      meta: buildPaginationMeta(paginated),
      filters: {
        search: search ?? null,
        governorate_id: governorateId ? Number(governorateId) : null,
      },
    })
  }
}
