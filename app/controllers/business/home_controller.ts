import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ChatMessage from '#models/chat_message'
import Order from '#models/order'
import Request from '#models/request'
import RequestResponse from '#models/request_response'
import { buildStatusCounts, startOfCurrentMonth } from '#helpers/admin_helper'
import { ApiResponse } from '#helpers/response'
import {
  serializeOrder,
  serializeRequest,
  serializeUserWithPhone,
} from '#helpers/request_helper'
import NotificationService from '#services/notification_service'

const REQUEST_STATUSES = ['new', 'accepted', 'confirmed', 'rejected', 'cancelled']
const ORDER_STATUSES = ['new', 'pending', 'delivered', 'cancelled']

async function getUnreadChatMessagesCount(businessUserId: number) {
  const result = await ChatMessage.query()
    .where('isRead', false)
    .whereNot('senderId', businessUserId)
    .whereHas('chat', (chatQuery) => {
      chatQuery.where('businessUserId', businessUserId)
    })
    .count('* as total')

  return Number(result[0].$extras.total)
}

async function rejectedRequestIdsForBusiness(businessUserId: number) {
  const rejectedResponses = await RequestResponse.query()
    .where('businessUserId', businessUserId)
    .where('status', 'rejected')
    .where('price', 0)
    .select('requestId')

  return rejectedResponses.map((row) => row.requestId)
}

function visibleRequestsQuery(rejectedIds: number[]) {
  const query = Request.query().whereNotIn('status', ['cancelled', 'rejected'])
  if (rejectedIds.length > 0) {
    query.whereNotIn('id', rejectedIds)
  }
  return query
}

function parseLimit(value: unknown) {
  return Math.min(20, Math.max(1, Number(value ?? 5) || 5))
}

export default class HomeController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const requestStatus = request.input('request_status') as string | undefined
      const orderStatus = request.input('order_status') as string | undefined
      const limit = parseLimit(request.input('limit'))
      const monthStart = startOfCurrentMonth()
      const rejectedIds = await rejectedRequestIdsForBusiness(business.id)

      const requestStatusQuery = visibleRequestsQuery(rejectedIds)
        .select('status')
        .count('* as count')
        .groupBy('status')

      const recentRequestsQuery = visibleRequestsQuery(rejectedIds).orderBy('createdAt', 'desc')
      if (requestStatus) {
        recentRequestsQuery.where('status', requestStatus)
      }

      const recentOrdersQuery = Order.query()
        .where('businessUserId', business.id)
        .orderBy('createdAt', 'desc')
      if (orderStatus) {
        recentOrdersQuery.where('status', orderStatus)
      }

      const [
        requestStatusRows,
        orderStatusRows,
        totalOrdersRow,
        totalRevenueRow,
        pendingAmountRow,
        receivedThisMonthRow,
        totalReceivedThisMonthRow,
        totalOrdersThisMonthRow,
        recentRequests,
        recentOrders,
        unreadChatsCount,
        unreadNotificationsCount,
      ] = await Promise.all([
        requestStatusQuery,
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .select('status')
          .count('* as count')
          .groupBy('status'),
        Order.query().where('businessUserId', business.id).count('* as total'),
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .where('payment_status', 'paid')
          .sum('total_amount as total')
          .first(),
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .where('payment_status', 'unpaid')
          .sum('total_amount as total')
          .first(),
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .where('payment_status', 'paid')
          .where('created_at', '>=', monthStart)
          .sum('total_amount as total')
          .first(),
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .where('payment_status', 'paid')
          .where('created_at', '>=', monthStart)
          .count('* as total')
          .first(),
        db
          .from('orders')
          .whereNull('deleted_at')
          .where('business_user_id', business.id)
          .where('created_at', '>=', monthStart)
          .count('* as total')
          .first(),
        recentRequestsQuery
          .preload('category')
          .preload('user')
          .preload('userVehicle', (vehicleQuery) => {
            vehicleQuery.preload('carBrand').preload('carModel')
          })
          .limit(limit),
        recentOrdersQuery
          .preload('user')
          .preload('request', (requestQuery) => {
            requestQuery.preload('category').preload('userVehicle', (vehicleQuery) => {
              vehicleQuery.preload('carBrand').preload('carModel')
            })
          })
          .limit(limit),
        getUnreadChatMessagesCount(business.id),
        NotificationService.getUnreadCount(business.id),
      ])

      const requestStatusCounts = buildStatusCounts(
        requestStatusRows as any as { status: string; count: number | string }[],
        REQUEST_STATUSES
      )
      const orderStatusCounts = buildStatusCounts(
        orderStatusRows as { status: string; count: number | string }[],
        ORDER_STATUSES
      )
      const totalRequests = Object.entries(requestStatusCounts)
        .filter(([status]) => status !== 'cancelled' && status !== 'rejected')
        .reduce((sum, [, count]) => sum + count, 0)

      return ApiResponse.success(response, {
        kpis: {
          total_requests: totalRequests,
          total_orders: Number(totalOrdersRow[0].$extras.total),
          total_revenue: Number(totalRevenueRow?.total ?? 0),
          pending_amount: Number(pendingAmountRow?.total ?? 0),
          received_amount: Number(totalRevenueRow?.total ?? 0),
          received_this_month: Number(receivedThisMonthRow?.total ?? 0),
          total_received_this_month: Number(totalReceivedThisMonthRow?.total ?? 0),
          total_orders_this_month: Number(totalOrdersThisMonthRow?.total ?? 0),
        },
        request_status_counts: requestStatusCounts,
        order_status_counts: orderStatusCounts,
        recent_requests: recentRequests.map((item) => serializeRequest(item)),
        recent_orders: recentOrders.map((order) => ({
          ...serializeOrder(order),
          user: order.user ? serializeUserWithPhone(order.user) : null,
        })),
        counts: {
          new_requests_count: requestStatusCounts.new ?? 0,
          new_orders_count: orderStatusCounts.new ?? 0,
          unread_chats_count: unreadChatsCount,
          unread_notifications_count: unreadNotificationsCount,
        },
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
