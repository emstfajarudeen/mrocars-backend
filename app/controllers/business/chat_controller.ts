import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Chat from '#models/chat'
import ChatMessage from '#models/chat_message'
import { ApiResponse } from '#helpers/response'
import { buildPaginationMeta, getPaginationParams, isValidationError } from '#helpers/masters'
import {
  buildChatNotificationBody,
  ensureChatLastMessageAt,
  findBusinessChat,
  getLastMessagesByChatIds,
  getUnreadCount,
  inferAttachmentType,
  markMessagesAsRead,
  serializeBusinessChatDetail,
  serializeBusinessChatListItem,
  serializeChatMessage,
  storeChatMessageFiles,
  validateChatFiles,
  validateMessageContent,
  VOICE_NOTE_OPTIONS,
  CHAT_ATTACHMENT_OPTIONS,
} from '#helpers/chat_helper'
import { sendMessageValidator } from '#validators/business/chat_validator'
import NotificationService, { NotificationType } from '#services/notification_service'
import BusinessProfile from '#models/business_profile'

const MESSAGE_PAGE_LIMIT = 30

export default class ChatController {
  async index({ auth, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()

      const chats = await Chat.query()
        .where('businessUserId', business.id)
        .preload('user')
        .preload('request', (requestQuery) => {
          requestQuery.preload('category')
          requestQuery.preload('userVehicle', (vehicleQuery) => {
            vehicleQuery.preload('carBrand')
            vehicleQuery.preload('carModel')
          })
        })
        .orderBy('lastMessageAt', 'desc')

      const chatIds = chats.map((chat) => chat.id)
      const lastMessages = await getLastMessagesByChatIds(chatIds)

      const data = await Promise.all(
        chats.map(async (chat) => {
          const unreadCount = await getUnreadCount(chat.id, business.id)
          return serializeBusinessChatListItem(chat, lastMessages.get(chat.id) ?? null, unreadCount)
        })
      )

      return ApiResponse.success(response, { chats: data })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async show({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const chat = await Chat.query()
        .where('id', params.id)
        .where('businessUserId', business.id)
        .preload('request', (requestQuery) => {
          requestQuery.preload('category')
          requestQuery.preload('userVehicle', (vehicleQuery) => {
            vehicleQuery.preload('carBrand')
            vehicleQuery.preload('carModel')
          })
          requestQuery.preload('attachments')
        })
        .preload('user')
        .first()

      if (!chat) {
        return ApiResponse.error(response, 'Chat not found', undefined, 404)
      }

      const { page, limit } = getPaginationParams(request)
      const perPage = Math.min(limit, MESSAGE_PAGE_LIMIT)

      const messagesPaginator = await ChatMessage.query()
        .where('chatId', chat.id)
        .orderBy('createdAt', 'asc')
        .paginate(page, perPage)

      await markMessagesAsRead(chat.id, chat.userId)
      await ensureChatLastMessageAt(chat)

      return ApiResponse.success(response, {
        chat: serializeBusinessChatDetail(chat),
        messages: messagesPaginator.all().map((message) => serializeChatMessage(message, chat)),
        meta: buildPaginationMeta(messagesPaginator),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async sendMessage({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const chat = await findBusinessChat(business.id, Number(params.id))

      if (!chat) {
        return ApiResponse.error(response, 'Chat not found', undefined, 404)
      }

      const payload = await request.validateUsing(sendMessageValidator)

      const voiceNoteFile = request.file('voice_note', VOICE_NOTE_OPTIONS)
      const attachmentFile = request.file('attachment', CHAT_ATTACHMENT_OPTIONS)

      const contentErrors = validateMessageContent(payload.message, voiceNoteFile, attachmentFile)
      if (contentErrors) {
        return ApiResponse.error(response, 'Validation failed', contentErrors, 422)
      }

      const fileErrors = validateChatFiles(voiceNoteFile, attachmentFile)
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      const { voiceNotePath, attachmentPath } = await storeChatMessageFiles(
        chat.id,
        voiceNoteFile,
        attachmentFile
      )

      const chatMessage = await ChatMessage.create({
        chatId: chat.id,
        senderId: business.id,
        message: payload.message ?? null,
        voiceNote: voiceNotePath,
        attachment: attachmentPath,
        attachmentType: inferAttachmentType(attachmentFile, payload.attachment_type),
        isRead: false,
      })

      chat.lastMessageAt = DateTime.now()
      await chat.save()

      const businessProfile = await BusinessProfile.query().where('userId', business.id).first()
      const senderName = businessProfile?.businessName ?? business.name

      await NotificationService.send({
        user_id: chat.userId,
        title: senderName,
        body: buildChatNotificationBody(
          payload.message,
          !!voiceNotePath,
          !!attachmentPath
        ),
        type: NotificationType.NEW_MESSAGE,
        data: {
          chat_id: chat.id,
          request_id: chat.requestId,
        },
      })

      return ApiResponse.success(
        response,
        { message: serializeChatMessage(chatMessage, chat) },
        'Message sent',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async markAsRead({ auth, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const chat = await findBusinessChat(business.id, Number(params.id))

      if (!chat) {
        return ApiResponse.error(response, 'Chat not found', undefined, 404)
      }

      await markMessagesAsRead(chat.id, chat.userId)

      return ApiResponse.success(
        response,
        { message: 'Messages marked as read' },
        'Messages marked as read'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
