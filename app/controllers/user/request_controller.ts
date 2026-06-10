import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Category from '#models/category'
import Chat from '#models/chat'
import Request from '#models/request'
import RequestAttachment from '#models/request_attachment'
import RequestResponse from '#models/request_response'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import {
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import {
  enrichResponseWithRating,
  applyRealOffersFilter,
  findOwnedRequest,
  generateRequestNo,
  isGuestUser,
  resolveCategoryId,
  serializeRequest,
} from '#helpers/request_helper'
import { storeFile, validateFile } from '#helpers/upload'
import { createRequestValidator } from '#validators/user/request_validator'
import NotificationService, { NotificationType } from '#services/notification_service'
import Order from '#models/order'

const PHOTO_OPTIONS = {
  size: '5mb' as const,
  extnames: ['jpg', 'jpeg', 'png', 'webp'],
}

const VOICE_NOTE_OPTIONS = {
  size: '10mb' as const,
  extnames: ['mp3', 'mp4', 'wav', 'm4a'],
}

function winchScheduleErrors(payload: {
  when_needed?: 'now' | 'later'
  scheduled_date?: Date
  scheduled_time?: string
}): Record<string, string[]> | null {
  if (payload.when_needed !== 'later') {
    return null
  }

  const errors: Record<string, string[]> = {}
  if (!payload.scheduled_date) {
    errors.scheduled_date = ['Scheduled date is required when when_needed is later']
  }
  if (!payload.scheduled_time?.trim()) {
    errors.scheduled_time = ['Scheduled time is required when when_needed is later']
  }

  return Object.keys(errors).length > 0 ? errors : null
}

export default class RequestController {
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      if (await isGuestUser(user.id)) {
        return response.status(401).json({
          success: false,
          message: 'Please login to submit a request',
          require_login: true,
        })
      }

      const payload = await request.validateUsing(createRequestValidator)
      const scheduleErrors = winchScheduleErrors(payload)
      if (scheduleErrors) {
        return ApiResponse.error(response, 'Validation failed', scheduleErrors, 422)
      }

      const category = await Category.find(payload.category_id)
      if (!category?.isActive) {
        return ApiResponse.error(response, 'Category not found', undefined, 404)
      }

      if (payload.user_vehicle_id) {
        const vehicle = await UserVehicle.query()
          .where('id', payload.user_vehicle_id)
          .where('userId', user.id)
          .first()
        if (!vehicle) {
          return ApiResponse.error(response, 'Vehicle not found', undefined, 404)
        }
      }

      const voiceNoteFile = request.file('voice_note', VOICE_NOTE_OPTIONS)
      const voiceErrors = validateFile(voiceNoteFile, 'voice_note', VOICE_NOTE_OPTIONS, false)
      if (voiceErrors) {
        return ApiResponse.error(response, 'Validation failed', voiceErrors, 422)
      }

      const photoFiles = request.files('photos', PHOTO_OPTIONS) ?? []
      if (photoFiles.length > 5) {
        return ApiResponse.error(
          response,
          'Validation failed',
          { photos: ['Maximum 5 photos allowed'] },
          422
        )
      }

      for (const [index, photo] of photoFiles.entries()) {
        const photoErrors = validateFile(photo, `photos.${index}`, PHOTO_OPTIONS, false)
        if (photoErrors) {
          return ApiResponse.error(response, 'Validation failed', photoErrors, 422)
        }
      }

      const created = await db.transaction(async (trx) => {
        const requestNo = await generateRequestNo(trx)

        const serviceRequest = await Request.create(
          {
            requestNo,
            userId: user.id,
            userVehicleId: payload.user_vehicle_id ?? null,
            categoryId: payload.category_id,
            title: payload.title,
            description: payload.description ?? null,
            sparePartType: payload.spare_part_type ?? null,
            noOfTyres: payload.no_of_tyres ?? null,
            whenNeeded: payload.when_needed ?? null,
            scheduledDate: payload.scheduled_date
              ? DateTime.fromJSDate(payload.scheduled_date)
              : null,
            scheduledTime: payload.scheduled_time ?? null,
            pickupLocationName: payload.pickup_location_name ?? null,
            pickupLatitude:
              payload.pickup_latitude !== undefined ? String(payload.pickup_latitude) : null,
            pickupLongitude:
              payload.pickup_longitude !== undefined ? String(payload.pickup_longitude) : null,
            deliveryLocationName: payload.delivery_location_name ?? null,
            deliveryLatitude:
              payload.delivery_latitude !== undefined ? String(payload.delivery_latitude) : null,
            deliveryLongitude:
              payload.delivery_longitude !== undefined
                ? String(payload.delivery_longitude)
                : null,
            status: 'new',
          },
          { client: trx }
        )

        if (voiceNoteFile) {
          serviceRequest.voiceNote = await storeFile(
            voiceNoteFile,
            `requests/voice-notes/${serviceRequest.id}`
          )
          serviceRequest.useTransaction(trx)
          await serviceRequest.save()
        }

        for (const photo of photoFiles) {
          const filePath = await storeFile(photo, `requests/photos/${serviceRequest.id}`)
          await RequestAttachment.create(
            {
              requestId: serviceRequest.id,
              filePath,
              fileType: photo.extname ?? 'image',
            },
            { client: trx }
          )
        }

        return serviceRequest
      })

      await created.load('category')
      await created.load('userVehicle', (query) => {
        query.preload('carBrand').preload('carModel')
      })
      await created.load('attachments')

      return ApiResponse.success(
        response,
        {
          request: serializeRequest(created),
          message: 'Request submitted successfully',
        },
        'Request submitted successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { page, limit } = getPaginationParams(request)
      const status = request.input('status') as string | undefined
      const categoryInput = request.input('category_id') as string | number | undefined

      const query = Request.query().where('userId', user.id).orderBy('createdAt', 'desc')

      if (status) {
        query.where('status', status)
      }

      const categoryId = await resolveCategoryId(categoryInput)
      if (categoryInput !== undefined && categoryId === null) {
        return ApiResponse.error(response, 'Category not found', undefined, 404)
      }
      if (categoryId) {
        query.where('categoryId', categoryId)
      }

      const paginated = await query
        .preload('category')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .withCount('responses', (countQuery) => applyRealOffersFilter(countQuery))
        .paginate(page, limit)

      const data = paginated.all().map((item) =>
        serializeRequest(item, {
          responsesCount: Number(item.$extras.responses_count ?? 0),
        })
      )

      return ApiResponse.success(response, {
        data,
        meta: buildPaginationMeta(paginated),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async show({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const governorateId = request.input('governorate_id')
      const areaId = request.input('area_id')

      const serviceRequest = await Request.query()
        .where('id', params.id)
        .where('userId', user.id)
        .preload('category')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .preload('attachments')
        .preload('responses', (responsesQuery) => {
          applyRealOffersFilter(responsesQuery)
            .orderBy('createdAt', 'asc')
            .preload('businessUser', (businessQuery) => {
              businessQuery.preload('businessProfile')
            })

          if (governorateId || areaId) {
            responsesQuery.whereExists((query) => {
              query
                .from('business_profiles')
                .whereRaw('business_profiles.user_id = request_responses.business_user_id')
              if (governorateId) {
                query.where('business_profiles.governorate_id', governorateId)
              }
              if (areaId) {
                query.where('business_profiles.area_id', areaId)
              }
            })
          }
        })
        .first()

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      const responses = await Promise.all(
        serviceRequest.responses.map((item) => enrichResponseWithRating(item, true))
      )

      return ApiResponse.success(response, {
        request: {
          ...serializeRequest(serviceRequest),
          responses,
        },
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async cancel({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const serviceRequest = await findOwnedRequest(user.id, Number(params.id))

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      if (serviceRequest.status !== 'new') {
        return ApiResponse.error(response, 'Only new requests can be cancelled', undefined, 422)
      }

      const respondedBusinesses = await applyRealOffersFilter(
        RequestResponse.query().where('requestId', serviceRequest.id)
      ).select('id', 'businessUserId')

      serviceRequest.status = 'cancelled'
      await serviceRequest.save()
      await serviceRequest.delete()

      await NotificationService.sendBulk(
        respondedBusinesses.map((item) => item.businessUserId),
        {
          title: 'Request Cancelled',
          body: `The request ${serviceRequest.title} has been cancelled`,
          type: NotificationType.REQUEST_CANCELLED,
          data: { request_id: serviceRequest.id },
        }
      )

      return ApiResponse.success(
        response,
        { message: 'Request cancelled successfully' },
        'Request cancelled successfully'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async responses({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const serviceRequest = await findOwnedRequest(user.id, Number(params.requestId))

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      const governorateId = request.input('governorate_id')
      const areaId = request.input('area_id')

      const responsesQuery = applyRealOffersFilter(
        RequestResponse.query().where('requestId', serviceRequest.id)
      )
        .orderBy('createdAt', 'asc')
        .preload('businessUser', (businessQuery) => {
          businessQuery.preload('businessProfile')
        })

      if (governorateId || areaId) {
        responsesQuery.whereExists((query) => {
          query
            .from('business_profiles')
            .whereRaw('business_profiles.user_id = request_responses.business_user_id')
          if (governorateId) {
            query.where('business_profiles.governorate_id', governorateId)
          }
          if (areaId) {
            query.where('business_profiles.area_id', areaId)
          }
        })
      }

      const responses = await responsesQuery

      const data = await Promise.all(
        responses.map((item) => enrichResponseWithRating(item, true))
      )

      return ApiResponse.success(response, { responses: data })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async showResponse({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const serviceRequest = await findOwnedRequest(user.id, Number(params.requestId))

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      const requestResponse = await RequestResponse.query()
        .where('id', params.responseId)
        .where('requestId', serviceRequest.id)
        .preload('businessUser', (businessQuery) => {
          businessQuery.preload('businessProfile')
        })
        .first()

      if (!requestResponse) {
        return ApiResponse.error(response, 'Response not found', undefined, 404)
      }

      const serialized = await enrichResponseWithRating(requestResponse, true)

      return ApiResponse.success(response, { response: serialized })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async acceptResponse({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const serviceRequest = await findOwnedRequest(user.id, Number(params.requestId))

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      if (serviceRequest.status !== 'confirmed') {
        return ApiResponse.error(
          response,
          'Request must be confirmed before accepting an offer',
          undefined,
          422
        )
      }

      const requestResponse = await RequestResponse.query()
        .where('id', params.responseId)
        .where('requestId', serviceRequest.id)
        .first()

      if (!requestResponse) {
        return ApiResponse.error(response, 'Response not found', undefined, 404)
      }

      let chatId: number

      await db.transaction(async (trx) => {
        requestResponse.status = 'accepted'
        requestResponse.useTransaction(trx)
        await requestResponse.save()

        await RequestResponse.query({ client: trx })
          .where('requestId', serviceRequest.id)
          .whereNot('id', requestResponse.id)
          .update({ status: 'rejected' })

        serviceRequest.status = 'accepted'
        serviceRequest.useTransaction(trx)
        await serviceRequest.save()

        let chat = await Chat.query({ client: trx })
          .where('requestId', serviceRequest.id)
          .where('userId', user.id)
          .where('businessUserId', requestResponse.businessUserId)
          .first()

        if (!chat) {
          chat = await Chat.create(
            {
              requestId: serviceRequest.id,
              userId: user.id,
              businessUserId: requestResponse.businessUserId,
            },
            { client: trx }
          )
        }

        chatId = chat.id
      })

      await serviceRequest.load('category')
      await serviceRequest.load('userVehicle', (vehicleQuery) => {
        vehicleQuery.preload('carBrand').preload('carModel')
      })

      const order = await Order.query()
        .where('requestResponseId', requestResponse.id)
        .first()

      await NotificationService.send({
        user_id: requestResponse.businessUserId,
        title: 'Offer Accepted',
        body: `${user.name} accepted your offer for ${serviceRequest.title}`,
        type: NotificationType.RESPONSE_ACCEPTED,
        data: {
          request_id: serviceRequest.id,
          response_id: requestResponse.id,
          order_id: order?.id ?? null,
        },
      })

      const rejectedResponses = await RequestResponse.query()
        .where('requestId', serviceRequest.id)
        .whereNot('id', requestResponse.id)
        .where('price', '>', 0)

      await NotificationService.sendBulk(
        rejectedResponses.map((item) => item.businessUserId),
        {
          title: 'Offer Not Selected',
          body: `Your offer for ${serviceRequest.title} was not selected`,
          type: NotificationType.RESPONSE_REJECTED,
          data: {
            request_id: serviceRequest.id,
            response_id: null,
          },
        }
      )

      return ApiResponse.success(
        response,
        {
          request: serializeRequest(serviceRequest),
          chat_id: chatId!,
          message: 'Offer accepted',
        },
        'Offer accepted'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
