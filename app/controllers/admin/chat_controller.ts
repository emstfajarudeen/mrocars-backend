import type { HttpContext } from '@adonisjs/core/http'
import Chat from '#models/chat'
import ChatMessage from '#models/chat_message'
import { ApiResponse } from '#helpers/response'
import { buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import {
  serializeBusinessProfileForOrder,
  serializeUserBrief,
} from '#helpers/request_helper'
import { serializeChatMessage, serializeRequestBrief } from '#helpers/chat_helper'

const MESSAGE_PAGE_LIMIT = 30

export default class ChatController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined

    const query = Chat.query().orderBy('lastMessageAt', 'desc')

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query.where((builder) => {
        builder
          .whereHas('user', (userQuery) => {
            userQuery.whereILike('name', term)
          })
          .orWhereHas('businessUser', (businessQuery) => {
            businessQuery.whereHas('businessProfile', (profileQuery) => {
              profileQuery.whereILike('businessName', term)
            })
          })
          .orWhereHas('request', (requestQuery) => {
            requestQuery.whereILike('requestNo', term)
          })
      })
    }

    const paginated = await query
      .preload('user')
      .preload('businessUser', (businessQuery) => {
        businessQuery.preload('businessProfile')
      })
      .preload('request')
      .withCount('messages')
      .paginate(page, limit)

    const data = paginated.all().map((chat) => ({
      ...chat.serialize(),
      user: chat.user ? serializeUserBrief(chat.user) : null,
      business_profile: chat.businessUser?.businessProfile
        ? { business_name: chat.businessUser.businessProfile.businessName }
        : null,
      request: chat.request
        ? {
            request_no: chat.request.requestNo,
            title: chat.request.title,
          }
        : null,
      messages_count: Number(chat.$extras.messages_count ?? 0),
      last_message_at: chat.lastMessageAt,
    }))

    return ApiResponse.success(response, {
      data,
      meta: buildPaginationMeta(paginated),
    })
  }

  async show({ request, params, response }: HttpContext) {
    const chat = await Chat.query()
      .where('id', params.id)
      .preload('user')
      .preload('businessUser', (businessQuery) => {
        businessQuery.preload('businessProfile', (profileQuery) => {
          profileQuery.preload('governorate').preload('area')
        })
      })
      .preload('request', (requestQuery) => {
        requestQuery.preload('category')
        requestQuery.preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand')
          vehicleQuery.preload('carModel')
        })
      })
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

    return ApiResponse.success(response, {
      chat: {
        ...chat.serialize(),
        user: chat.user ? serializeUserBrief(chat.user) : null,
        business_user: chat.businessUser ? serializeUserBrief(chat.businessUser) : null,
        business_profile: chat.businessUser?.businessProfile
          ? serializeBusinessProfileForOrder(chat.businessUser.businessProfile)
          : null,
        request: serializeRequestBrief(chat),
      },
      messages: messagesPaginator.all().map((message) => serializeChatMessage(message, chat)),
      meta: buildPaginationMeta(messagesPaginator),
    })
  }

  async destroy({ params, response }: HttpContext) {
    const chat = await Chat.find(params.id)

    if (!chat) {
      return ApiResponse.error(response, 'Chat not found', undefined, 404)
    }

    await chat.delete()

    return ApiResponse.success(
      response,
      { message: 'Chat deleted successfully' },
      'Chat deleted successfully'
    )
  }
}
