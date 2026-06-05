import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import { buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import { serializeOrder, serializeUserBrief } from '#helpers/request_helper'

function adminOrderDetailQuery() {
  return Order.query()
    .preload('request', (requestQuery) => {
      requestQuery
        .preload('category')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .preload('attachments')
    })
    .preload('requestResponse')
    .preload('user')
    .preload('businessUser', (businessQuery) => {
      businessQuery.preload('businessProfile', (profileQuery) => {
        profileQuery.preload('governorate').preload('area')
      })
    })
    .preload('deliveryAddress', (addressQuery) => {
      addressQuery.preload('governorate').preload('area')
    })
    .preload('additionalWorks')
    .preload('rating')
}

export default class OrderController {
  async index({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const status = request.input('status') as string | undefined
    const paymentStatus = request.input('payment_status') as string | undefined
    const search = request.input('search') as string | undefined
    const dateFrom = request.input('date_from') as string | undefined
    const dateTo = request.input('date_to') as string | undefined

    const query = Order.query().orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (paymentStatus) {
      query.where('paymentStatus', paymentStatus)
    }

    if (dateFrom) {
      const from = DateTime.fromISO(dateFrom).startOf('day')
      if (from.isValid) {
        query.where('createdAt', '>=', from.toSQL()!)
      }
    }

    if (dateTo) {
      const to = DateTime.fromISO(dateTo).endOf('day')
      if (to.isValid) {
        query.where('createdAt', '<=', to.toSQL()!)
      }
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query.where((builder) => {
        builder
          .whereILike('orderNo', term)
          .orWhereHas('user', (userQuery) => {
            userQuery.whereILike('name', term)
          })
      })
    }

    const paginated = await query
      .preload('user')
      .preload('businessUser', (businessQuery) => {
        businessQuery.preload('businessProfile')
      })
      .preload('request', (requestQuery) => {
        requestQuery.preload('category')
      })
      .paginate(page, limit)

    return inertia.render('admin/Orders', {
      orders: paginated.all().map((order) => ({
        ...order.serialize(),
        user: order.user ? serializeUserBrief(order.user) : null,
        business_profile: order.businessUser?.businessProfile
          ? { business_name: order.businessUser.businessProfile.businessName }
          : null,
        request: order.request
          ? { category: order.request.category?.serialize() ?? null }
          : null,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
      })),
      meta: buildPaginationMeta(paginated),
      filters: {
        status: status ?? null,
        payment_status: paymentStatus ?? null,
        search: search ?? null,
        date_from: dateFrom ?? null,
        date_to: dateTo ?? null,
      },
    })
  }

  async show({ params, inertia, response }: HttpContext) {
    const order = await adminOrderDetailQuery().where('id', params.id).first()

    if (!order) {
      return response.redirect('/admin/orders')
    }

    return inertia.render('admin/OrderDetail', {
      order: serializeOrder(order, { includeTimeline: true }),
    })
  }
}
