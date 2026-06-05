import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import { ApiResponse } from '#helpers/response'
import { buildPaginationMeta, getPaginationParams, isValidationError } from '#helpers/masters'
import { serializeOrder, serializeUserBrief } from '#helpers/request_helper'
import { updateOrderStatusValidator } from '#validators/admin/order_validator'

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
  async index({ request, response }: HttpContext) {
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

    const data = paginated.all().map((order) => ({
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
    }))

    return ApiResponse.success(response, {
      data,
      meta: buildPaginationMeta(paginated),
    })
  }

  async show({ params, response }: HttpContext) {
    const order = await adminOrderDetailQuery().where('id', params.id).first()

    if (!order) {
      return ApiResponse.error(response, 'Order not found', undefined, 404)
    }

    return ApiResponse.success(response, {
      order: serializeOrder(order, { includeTimeline: true }),
    })
  }

  async updateStatus({ request, params, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateOrderStatusValidator)
      const order = await Order.find(params.id)

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      order.status = payload.status
      await order.save()

      const updated = await adminOrderDetailQuery().where('id', order.id).firstOrFail()

      return ApiResponse.success(
        response,
        { order: serializeOrder(updated, { includeTimeline: true }) },
        'Order status updated'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async stats({ response }: HttpContext) {
    const orderStatusRows = await db
      .from('orders')
      .whereNull('deleted_at')
      .select('status')
      .count('* as count')
      .groupBy('status')

    const ordersByStatus: Record<string, number> = {}
    let totalOrders = 0
    for (const row of orderStatusRows) {
      const count = Number(row.count)
      ordersByStatus[row.status as string] = count
      totalOrders += count
    }

    const revenueRow = await db
      .from('orders')
      .whereNull('deleted_at')
      .where('payment_status', 'paid')
      .sum('total_amount as total')
      .first()

    const pendingRow = await db
      .from('orders')
      .whereNull('deleted_at')
      .where('payment_status', 'unpaid')
      .sum('total_amount as total')
      .first()

    const requestStatusRows = await db
      .from('requests')
      .whereNull('deleted_at')
      .select('status')
      .count('* as count')
      .groupBy('status')

    const requestsByStatus: Record<string, number> = {}
    let totalRequests = 0
    for (const row of requestStatusRows) {
      const count = Number(row.count)
      requestsByStatus[row.status as string] = count
      totalRequests += count
    }

    const totalRevenue = Number(revenueRow?.total ?? 0)
    const pendingAmount = Number(pendingRow?.total ?? 0)

    return ApiResponse.success(response, {
      stats: {
        total_orders: totalOrders,
        orders_by_status: ordersByStatus,
        total_revenue: totalRevenue,
        pending_amount: pendingAmount,
        received_amount: totalRevenue,
        total_requests: totalRequests,
        requests_by_status: requestsByStatus,
      },
    })
  }
}
