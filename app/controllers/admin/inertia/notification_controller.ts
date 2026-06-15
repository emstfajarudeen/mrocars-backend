import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import NotificationService from '#services/notification_service'
import { ApiResponse } from '#helpers/response'
import db from '@adonisjs/lucid/services/db'

export default class NotificationController {
  async index({ inertia }: HttpContext) {
    const campaigns = await db
      .from('notifications')
      .where('type', 'general')
      .groupBy('title', 'body', 'created_at')
      .select('title', 'body', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(20)

    return inertia.render('admin/Notifications', {
      campaigns: campaigns.map((c) => ({
        title: c.title,
        body: c.body,
        created_at: c.created_at,
      })),
    })
  }

  async send({ request, response }: HttpContext) {
    try {
      const title = request.input('title') as string
      const body = request.input('body') as string
      const recipientType = request.input('recipient_type') as 'all' | 'users' | 'businesses'

      if (!title || !body || !recipientType) {
        return ApiResponse.error(response, 'Title, body and recipient type are required', undefined, 422)
      }

      const usersQuery = User.query().select('id')
      if (recipientType === 'users') {
        usersQuery.where('role', 'user')
      } else if (recipientType === 'businesses') {
        usersQuery.where('role', 'business')
      } else {
        usersQuery.whereIn('role', ['user', 'business'])
      }

      const users = await usersQuery
      const userIds = users.map((u) => u.id)

      if (userIds.length > 0) {
        await NotificationService.sendBulk(userIds, {
          title,
          body,
          type: 'general',
        })
      }

      return ApiResponse.success(response, { message: 'Notification sent successfully' })
    } catch {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
