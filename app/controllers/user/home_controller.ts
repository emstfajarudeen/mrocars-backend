import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import Category from '#models/category'
import ChatMessage from '#models/chat_message'
import Order from '#models/order'
import Request from '#models/request'
import User from '#models/user'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import {
  serializeLocalizedBanner,
  serializeLocalizedCategory,
} from '#helpers/masters'
import { serializeUserVehicle } from '#helpers/request_helper'
import NotificationService from '#services/notification_service'

async function getUnreadChatMessagesCount(userId: number) {
  const result = await ChatMessage.query()
    .where('isRead', false)
    .whereNot('senderId', userId)
    .whereHas('chat', (chatQuery) => {
      chatQuery.where('userId', userId)
    })
    .count('* as total')

  return Number(result[0].$extras.total)
}

export default class HomeController {
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User

      const [
        banners,
        defaultVehicle,
        categories,
        requestsCount,
        ordersCount,
        unreadChatsCount,
        unreadNotificationsCount,
      ] = await Promise.all([
        Banner.query().where('isActive', true).orderBy('sortOrder', 'asc'),
        UserVehicle.query()
          .where('userId', user.id)
          .where('isDefault', true)
          .preload('carBrand')
          .preload('carModel')
          .first(),
        Category.query().where('isActive', true).orderBy('sortOrder', 'asc'),
        Request.query().where('userId', user.id).where('status', 'new').count('* as total'),
        Order.query().where('userId', user.id).where('status', 'new').count('* as total'),
        getUnreadChatMessagesCount(user.id),
        NotificationService.getUnreadCount(user.id),
      ])

      return ApiResponse.success(response, {
        banners: banners.map((banner) => serializeLocalizedBanner(banner, user.language)),
        default_vehicle: serializeUserVehicle(defaultVehicle),
        categories: categories.map((category) =>
          serializeLocalizedCategory(category, user.language)
        ),
        counts: {
          new_requests_count: Number(requestsCount[0].$extras.total),
          new_orders_count: Number(ordersCount[0].$extras.total),
          unread_chats_count: unreadChatsCount,
          unread_notifications_count: unreadNotificationsCount,
        },
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
