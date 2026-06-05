import type { HttpContext } from '@adonisjs/core/http'
import type { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'
import { publicUrl } from '#helpers/upload'
import type CarBrand from '#models/car_brand'
import type Category from '#models/category'

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
  query: { where: (column: string, value: number) => { count: (column: string) => Promise<unknown[]> } },
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
  return {
    ...category.serialize(),
    image_url: publicUrl(category.image),
  }
}
