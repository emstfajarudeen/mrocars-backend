import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import {
  applySearch,
  buildPaginationMeta,
  getPaginationParams,
  serializeBanner,
} from '#helpers/masters'

const SEARCH_COLUMNS = ['titleEn', 'titleAr']

export default class BannerController {
  async index({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Banner.query().orderBy('sortOrder', 'asc')
    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return inertia.render('admin/Banners', {
      banners: paginated.all().map((banner) => serializeBanner(banner)),
      meta: buildPaginationMeta(paginated),
      filters: { search: search ?? null },
    })
  }
}
