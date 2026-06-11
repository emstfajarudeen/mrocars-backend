import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { ApiResponse } from '#helpers/response'
import { applySearch, buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import { parseBooleanQuery } from '#helpers/admin_helper'
import { publicUrl } from '#helpers/upload'

const USER_SEARCH_COLUMNS = ['name', 'email', 'phoneNumber']

function serializeAdminUserListItem(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone_code: user.phoneCode,
    phone_number: user.phoneNumber,
    avatar_url: publicUrl(user.avatar),
    language: user.language,
    is_active: user.isActive,
    created_at: user.createdAt,
    total_requests: Number(user.$extras.requests_count ?? 0),
    total_orders: Number(user.$extras.orders_count ?? 0),
  }
}

export default class GuestController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const isActive = parseBooleanQuery(request.input('is_active'))

    const query = User.query()
      .where('role', 'user')
      .where((q) => q.whereNull('password').orWhere('email', 'like', 'guest_%@guest.com'))
      .orderBy('createdAt', 'desc')

    applySearch(query, search, USER_SEARCH_COLUMNS)

    if (isActive !== undefined) {
      query.where('isActive', isActive)
    }

    const paginated = await query.withCount('requests').withCount('orders').paginate(page, limit)

    return ApiResponse.success(response, {
      data: paginated.all().map((user) => serializeAdminUserListItem(user)),
      meta: buildPaginationMeta(paginated),
    })
  }
}
