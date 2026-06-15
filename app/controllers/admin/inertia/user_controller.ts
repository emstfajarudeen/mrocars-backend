import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
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

export default class UserController {
  async index({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const isActive = parseBooleanQuery(request.input('is_active'))

    const query = User.query()
      .where('role', 'user')
      .whereNotNull('password')
      .whereNot('email', 'like', 'guest_%@guest.com')
      .orderBy('createdAt', 'desc')

    applySearch(query, search, USER_SEARCH_COLUMNS)

    if (isActive !== undefined) {
      query.where('isActive', isActive)
    }

    const paginated = await query.withCount('requests').withCount('orders').paginate(page, limit)

    return inertia.render('admin/Users', {
      users: paginated.all().map((user) => serializeAdminUserListItem(user)),
      meta: buildPaginationMeta(paginated),
      filters: {
        search: search ?? null,
        is_active: isActive ?? null,
      },
    })
  }

  async show({ params, inertia, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .where('role', 'user')
      .whereNotNull('password')
      .whereNot('email', 'like', 'guest_%@guest.com')
      .preload('vehicles', (vehicleQuery) => {
        vehicleQuery.preload('carBrand').preload('carModel')
      })
      .preload('addresses', (addressQuery) => {
        addressQuery.preload('governorate').preload('area')
      })
      .first()

    if (!user) {
      return response.redirect('/admin/users')
    }

    const [requestsCount, ordersCount, spentRow] = await Promise.all([
      db.from('requests').where('user_id', user.id).whereNull('deleted_at').count('* as total'),
      db.from('orders').where('user_id', user.id).whereNull('deleted_at').count('* as total'),
      db
        .from('orders')
        .where('user_id', user.id)
        .whereNull('deleted_at')
        .where('payment_status', 'paid')
        .sum('total_amount as total'),
    ])

    const vehicles = user.vehicles.map((vehicle) => ({
      ...vehicle.serialize(),
      photo_url: vehicle.photos && vehicle.photos.length > 0 ? publicUrl(vehicle.photos[0]) : null,
      car_brand: vehicle.carBrand?.serialize() ?? null,
      car_model: vehicle.carModel?.serialize() ?? null,
    }))

    const addresses = user.addresses.map((address) => ({
      ...address.serialize(),
      governorate: address.governorate?.serialize() ?? null,
      area: address.area?.serialize() ?? null,
    }))

    return inertia.render('admin/UserDetail', {
      user: {
        ...user.serialize(),
        phone_code: user.phoneCode,
        phone_number: user.phoneNumber,
        avatar_url: publicUrl(user.avatar),
        vehicles,
        addresses,
        is_guest: false,
        stats: {
          total_requests: Number(requestsCount[0].total),
          total_orders: Number(ordersCount[0].total),
          total_spent: Number(spentRow[0]?.total ?? 0),
        },
      },
    })
  }
}
