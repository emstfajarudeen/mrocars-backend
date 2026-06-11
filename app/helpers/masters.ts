import type { HttpContext } from '@adonisjs/core/http'
import type { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'
import { publicUrl } from '#helpers/upload'
import type Banner from '#models/banner'
import type CarBrand from '#models/car_brand'
import type Category from '#models/category'
import type { UserLanguage } from '#types/user'

export function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

export function getPaginationParams(request: HttpContext['request']) {
  const page = Math.max(1, Number(request.input('page', 1)) || 1)
  const limit = Math.min(100, Math.max(1, Number(request.input('limit', 20)) || 20))
  return { page, limit }
}

export function applySearch(
  query: { where: (callback: (builder: SearchQueryBuilder) => void) => unknown },
  search: string | undefined,
  columns: string[]
) {
  if (!search?.trim()) {
    return query
  }

  const term = `%${search.trim()}%`
  query.where((builder) => {
    for (const [index, column] of columns.entries()) {
      if (index === 0) {
        builder.whereILike(column, term)
      } else {
        builder.orWhereILike(column, term)
      }
    }
  })

  return query
}

type SearchQueryBuilder = {
  whereILike: (column: string, value: string) => void
  orWhereILike: (column: string, value: string) => void
}

export function buildPaginationMeta(paginator: SimplePaginatorContract<unknown>) {
  return {
    total: paginator.total,
    per_page: paginator.perPage,
    current_page: paginator.currentPage,
    last_page: paginator.lastPage,
  }
}

export async function countRelated(
  query: {
    where: (column: string, value: number) => { count: (column: string) => Promise<unknown[]> }
  },
  column: string,
  value: number
): Promise<number> {
  const result = (await query.where(column, value).count('* as total')) as {
    $extras: { total: number }
  }[]
  return Number(result[0].$extras.total)
}

export function serializeCarBrand(brand: CarBrand) {
  return {
    ...brand.serialize(),
    logo_url: publicUrl(brand.logo),
  }
}

export function serializeCategory(category: Category) {
  const data = category.serialize()
  return {
    ...data,
    name_en: category.nameEn,
    nameEn: category.nameEn,
    name_ar: category.nameAr,
    nameAr: category.nameAr,
    description_en: category.descriptionEn,
    descriptionEn: category.descriptionEn,
    description_ar: category.descriptionAr,
    descriptionAr: category.descriptionAr,
    image_url: publicUrl(category.image),
    imageUrl: publicUrl(category.image),
  }
}

export function serializeLocalizedCategory(category: Category, language: UserLanguage) {
  return {
    id: category.id,
    name: language === 'ar' ? category.nameAr : category.nameEn,
    description: language === 'ar' ? category.descriptionAr : category.descriptionEn,
    image_url: publicUrl(category.image),
  }
}

export function serializeBanner(banner: Banner) {
  return {
    ...banner.serialize(),
    image_url: publicUrl(banner.image),
  }
}

export function serializeLocalizedBanner(banner: Banner, language: UserLanguage) {
  return {
    id: banner.id,
    title: language === 'ar' ? banner.titleAr : banner.titleEn,
    description: language === 'ar' ? banner.descriptionAr : banner.descriptionEn,
    image_url: publicUrl(banner.image),
  }
}
