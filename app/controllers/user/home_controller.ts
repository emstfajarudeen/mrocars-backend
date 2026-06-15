import type { HttpContext } from '@adonisjs/core/http'
import Banner from '#models/banner'
import Category from '#models/category'
import ChatMessage from '#models/chat_message'
import Order from '#models/order'
import Request from '#models/request'
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
      const isAuthenticated = await auth.use('jwt').check()
      const user = isAuthenticated ? auth.use('jwt').user : null

      const bannersQuery = Banner.query().where('isActive', true).orderBy('sortOrder', 'asc')
      const categoriesQuery = Category.query().where('isActive', true).orderBy('sortOrder', 'asc')

      let banners
      let categories
      let defaultVehicle = null
      let requestsCount = 0
      let ordersCount = 0
      let unreadChatsCount = 0
      let unreadNotificationsCount = 0

      if (user) {
        const [
          fetchedBanners,
          fetchedDefaultVehicle,
          fetchedCategories,
          fetchedRequestsCount,
          fetchedOrdersCount,
          fetchedUnreadChatsCount,
          fetchedUnreadNotificationsCount,
        ] = await Promise.all([
          bannersQuery,
          UserVehicle.query()
            .where('userId', user.id)
            .where('isDefault', true)
            .preload('carBrand')
            .preload('carModel')
            .first(),
          categoriesQuery,
          Request.query().where('userId', user.id).where('status', 'new').count('* as total'),
          Order.query().where('userId', user.id).where('status', 'new').count('* as total'),
          getUnreadChatMessagesCount(user.id),
          NotificationService.getUnreadCount(user.id),
        ])

        banners = fetchedBanners
        defaultVehicle = fetchedDefaultVehicle
        categories = fetchedCategories
        requestsCount = Number(fetchedRequestsCount[0].$extras.total || 0)
        ordersCount = Number(fetchedOrdersCount[0].$extras.total || 0)
        unreadChatsCount = fetchedUnreadChatsCount
        unreadNotificationsCount = fetchedUnreadNotificationsCount
      } else {
        const [fetchedBanners, fetchedCategories] = await Promise.all([
          bannersQuery,
          categoriesQuery,
        ])
        banners = fetchedBanners
        categories = fetchedCategories
      }

      const language = user?.language || 'en'

      return ApiResponse.success(response, {
        banners: banners.map((banner) => serializeLocalizedBanner(banner, language)),
        default_vehicle: serializeUserVehicle(defaultVehicle),
        categories: categories.map((category) =>
          serializeLocalizedCategory(category, language)
        ),
        counts: {
          new_requests_count: requestsCount,
          new_orders_count: ordersCount,
          unread_chats_count: unreadChatsCount,
          unread_notifications_count: unreadNotificationsCount,
        },
      })
    } catch (error) {
      console.error('Home controller error:', error)
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
