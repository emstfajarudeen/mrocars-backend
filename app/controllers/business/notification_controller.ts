import type { HttpContext } from '@adonisjs/core/http'
import Notification from '#models/notification'
import { ApiResponse } from '#helpers/response'
import { buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import NotificationService from '#services/notification_service'

function parseIsReadFilter(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return undefined
}

export default class NotificationController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { page, limit } = getPaginationParams(request)
      const isRead = parseIsReadFilter(request.input('is_read'))

      const query = Notification.query().where('userId', user.id).orderBy('createdAt', 'desc')

      if (isRead === true) {
        query.where('isRead', true)
      } else if (isRead === false) {
        query.where('isRead', false)
      }

      const paginated = await query.paginate(page, limit)
      const unreadCount = await NotificationService.getUnreadCount(user.id)

      return ApiResponse.success(response, {
        data: paginated.all().map((notification) => notification.serialize()),
        meta: buildPaginationMeta(paginated),
        unread_count: unreadCount,
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async readAll({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      await Notification.query().where('userId', user.id).where('isRead', false).update({
        isRead: true,
      })

      return ApiResponse.success(
        response,
        { message: 'All notifications marked as read' },
        'All notifications marked as read'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async markAsRead({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const notification = await Notification.query()
        .where('id', params.id)
        .where('userId', user.id)
        .first()

      if (!notification) {
        return ApiResponse.error(response, 'Notification not found', undefined, 404)
      }

      notification.isRead = true
      await notification.save()

      return ApiResponse.success(
        response,
        { message: 'Notification marked as read' },
        'Notification marked as read'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const notification = await Notification.query()
        .where('id', params.id)
        .where('userId', user.id)
        .first()

      if (!notification) {
        return ApiResponse.error(response, 'Notification not found', undefined, 404)
      }

      await notification.delete()

      return ApiResponse.success(
        response,
        { message: 'Notification deleted' },
        'Notification deleted'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async unreadCount({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const unreadCount = await NotificationService.getUnreadCount(user.id)

      return ApiResponse.success(response, { unread_count: unreadCount })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
