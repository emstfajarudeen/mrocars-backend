import logger from '@adonisjs/core/services/logger'
import Notification from '#models/notification'

export enum NotificationType {
  NEW_RESPONSE = 'new_response',
  RESPONSE_ACCEPTED = 'response_accepted',
  RESPONSE_REJECTED = 'response_rejected',
  REQUEST_CANCELLED = 'request_cancelled',
  ORDER_PLACED = 'order_placed',
  ORDER_STATUS_UPDATED = 'order_status_updated',
  ADDITIONAL_WORK_REQUESTED = 'additional_work_requested',
  ADDITIONAL_WORK_RESPONDED = 'additional_work_responded',
  NEW_MESSAGE = 'new_message',
}

export interface NotificationPayload {
  user_id: number
  title: string
  body: string
  type: NotificationType | string
  data?: Record<string, unknown>
}

export default class NotificationService {
  static async send(payload: NotificationPayload): Promise<Notification | null> {
    try {
      const notification = await Notification.create({
        userId: payload.user_id,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ?? null,
        isRead: false,
      })

      // TODO: send FCM push notification here

      return notification
    } catch (error) {
      logger.error({ err: error, payload }, 'Failed to send notification')
      return null
    }
  }

  static async sendBulk(
    userIds: number[],
    payload: Omit<NotificationPayload, 'user_id'>
  ): Promise<void> {
    if (userIds.length === 0) {
      return
    }

    try {
      await Notification.createMany(
        userIds.map((userId) => ({
          userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data ?? null,
          isRead: false,
        }))
      )

      // TODO: bulk FCM push
    } catch (error) {
      logger.error({ err: error, userIds, payload }, 'Failed to send bulk notifications')
    }
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const result = await Notification.query()
      .where('userId', userId)
      .where('isRead', false)
      .count('* as total')

    return Number(result[0].$extras.total)
  }
}
