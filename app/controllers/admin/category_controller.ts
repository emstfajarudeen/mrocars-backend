import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import Request from '#models/request'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, storeFile, validateImageFile } from '#helpers/upload'
import {
  applySearch,
  buildPaginationMeta,
  countRelated,
  getPaginationParams,
  isValidationError,
  serializeCategory,
} from '#helpers/masters'
import {
  categoryReorderValidator,
  categoryValidator,
} from '#validators/admin/masters_validator'

const SEARCH_COLUMNS = ['nameEn', 'nameAr']

export default class CategoryController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Category.query().orderBy('sortOrder', 'asc')
    applySearch(query, search, SEARCH_COLUMNS)

    const paginated = await query.paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((c) => serializeCategory(c)),
      meta: buildPaginationMeta(paginated),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(categoryValidator)
      const image = request.file('image', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(image, 'image', false)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      let imagePath: string | null = null
      if (image) {
        imagePath = await storeFile(image, 'categories')
      }

      const category = await Category.create({
        nameEn: payload.name_en,
        nameAr: payload.name_ar || payload.name_en,
        descriptionEn: payload.description_en ?? null,
        descriptionAr: payload.description_ar ?? payload.description_en ?? null,
        sortOrder: payload.sort_order ?? 0,
        isActive: payload.is_active ?? true,
        image: imagePath,
      })

      return ApiResponse.success(
        response,
        { category: serializeCategory(category) },
        'Category created successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[Category.store] ERROR:', error)
      return ApiResponse.error(response, `Debug: ${msg}`, undefined, 500)
    }
  }

  async show({ params, response }: HttpContext) {
    const category = await Category.find(params.id)

    if (!category) {
      return ApiResponse.error(response, 'Category not found', undefined, 404)
    }

    return ApiResponse.success(response, { category: serializeCategory(category) })
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const category = await Category.find(params.id)
      if (!category) {
        return ApiResponse.error(response, 'Category not found', undefined, 404)
      }

      const payload = await request.validateUsing(categoryValidator)
      const image = request.file('image', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const fileErrors = validateImageFile(image, 'image', false)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      category.nameEn = payload.name_en
      category.nameAr = payload.name_ar || payload.name_en
      category.descriptionEn = payload.description_en ?? null
      category.descriptionAr = payload.description_ar ?? payload.description_en ?? null
      if (payload.sort_order !== undefined) category.sortOrder = payload.sort_order
      if (payload.is_active !== undefined) category.isActive = payload.is_active

      if (image) {
        await deleteFileIfExists(category.image)
        category.image = await storeFile(image, 'categories')
      }

      await category.save()

      return ApiResponse.success(
        response,
        { category: serializeCategory(category) },
        'Category updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[Category.update] ERROR:', error)
      return ApiResponse.error(response, `Debug: ${msg}`, undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return ApiResponse.error(response, 'Category not found', undefined, 404)
    }

    if ((await countRelated(Request.query(), 'categoryId', category.id)) > 0) {
      return ApiResponse.error(response, 'Cannot delete, has related records', undefined, 422)
    }

    await deleteFileIfExists(category.image)
    await category.delete()

    return ApiResponse.success(response, {}, 'Category deleted successfully')
  }

  async toggleStatus({ params, response }: HttpContext) {
    const category = await Category.find(params.id)
    if (!category) {
      return ApiResponse.error(response, 'Category not found', undefined, 404)
    }

    category.isActive = !category.isActive
    await category.save()

    return ApiResponse.success(
      response,
      { category: serializeCategory(category) },
      'Category status updated'
    )
  }

  async reorder({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(categoryReorderValidator)

      for (const item of payload.items) {
        await Category.query().where('id', item.id).update({ sortOrder: item.sort_order })
      }

      const categories = await Category.query().orderBy('sortOrder', 'asc')

      return ApiResponse.success(
        response,
        { categories: categories.map((c) => serializeCategory(c)) },
        'Categories reordered successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
