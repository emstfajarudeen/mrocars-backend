import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import BusinessProfile from '#models/business_profile'
import Request from '#models/request'
import RequestResponse from '#models/request_response'
import { ApiResponse } from '#helpers/response'
import {
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import {
  generateResponseNo,
  isRejectionMarker,
  resolveCategoryId,
  serializeRequest,
  serializeRequestResponse,
} from '#helpers/request_helper'
import { deleteFileIfExists, storeFile, validateFile } from '#helpers/upload'
import {
  createResponseValidator,
  updateResponseValidator,
} from '#validators/business/request_validator'
import NotificationService, { NotificationType } from '#services/notification_service'

const RESPONSE_ATTACHMENT_OPTIONS = {
  size: '5mb' as const,
  extnames: ['jpg', 'jpeg', 'png', 'pdf'],
}

function offerValidityErrors(payload: {
  offer_validity_type: 'date' | 'open'
  offer_valid_until?: Date
}): Record<string, string[]> | null {
  if (payload.offer_validity_type !== 'date') {
    return null
  }

  if (!payload.offer_valid_until) {
    return { offer_valid_until: ['Offer valid until date is required when validity type is date'] }
  }

  return null
}

export default class RequestController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const { page, limit } = getPaginationParams(request)
      const status = request.input('status') as string | undefined
      const categoryInput = request.input('category_id') as string | number | undefined
      const areaId = request.input('area_id') as number | undefined

      const rejectedRequestIds = await RequestResponse.query()
        .where('businessUserId', business.id)
        .where('status', 'rejected')
        .where('price', 0)
        .select('requestId')

      const rejectedIds = rejectedRequestIds.map((row) => row.requestId)

      const query = Request.query()
        .whereNotIn('status', ['cancelled', 'rejected'])
        .orderBy('createdAt', 'desc')

      if (rejectedIds.length > 0) {
        query.whereNotIn('id', rejectedIds)
      }

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

      if (areaId) {
        const profile = await BusinessProfile.query().where('userId', business.id).first()
        if (profile?.areaId === areaId) {
          query.where((builder) => {
            builder
              .whereNotNull('pickupLocationName')
              .orWhereNotNull('deliveryLocationName')
          })
        }
      }

      const paginated = await query
        .preload('category')
        .preload('user')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .paginate(page, limit)

      const requestIds = paginated.all().map((item) => item.id)
      const myResponses =
        requestIds.length > 0
          ? await RequestResponse.query()
              .where('businessUserId', business.id)
              .whereIn('requestId', requestIds)
          : []

      const data = paginated.all().map((item) => {
        const mine = myResponses.find((row) => row.requestId === item.id)
        const hasResponded = mine !== undefined && !isRejectionMarker(mine)
        return {
          request_no: item.requestNo,
          user_name: item.user?.name || null,
          title: item.title,
          category: item.category ? (business.language === 'ar' ? item.category.nameAr : item.category.nameEn) : null,
          spare_part_type: item.sparePartType,
          no_of_tyres: item.noOfTyres,
          vehicle: item.userVehicle ? {
            brand: item.userVehicle.carBrand?.name || null,
            model: item.userVehicle.carModel?.name || null,
            year: item.userVehicle.year || null,
          } : null,
          description: item.description,
          submitted: item.createdAt?.toISO() ?? null,
          status: item.status,
          has_responded: hasResponded,
        }
      })

      return ApiResponse.success(response, {
        data,
        meta: buildPaginationMeta(paginated),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const serviceRequest = await Request.query()
        .where('id', params.id)
        .whereNotIn('status', ['cancelled', 'rejected'])
        .preload('category')
        .preload('user')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .preload('attachments')
        .first()

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      const myResponse = await RequestResponse.query()
        .where('requestId', serviceRequest.id)
        .where('businessUserId', business.id)
        .first()

      const serializedReq = serializeRequest(serviceRequest)

      return ApiResponse.success(response, {
        request: {
          request_no: serviceRequest.requestNo,
          user_name: serviceRequest.user?.name || null,
          submitted: serviceRequest.createdAt?.toISO() ?? null,
          status: serviceRequest.status,
          category: serviceRequest.category ? (business.language === 'ar' ? serviceRequest.category.nameAr : serviceRequest.category.nameEn) : null,
          vehicle: serviceRequest.userVehicle ? {
            brand: serviceRequest.userVehicle.carBrand?.name || null,
            model: serviceRequest.userVehicle.carModel?.name || null,
            year: serviceRequest.userVehicle.year || null,
          } : null,
          title: serviceRequest.title,
          description: serviceRequest.description,
          no_of_tyres: serviceRequest.noOfTyres,
          when_needed: serviceRequest.whenNeeded,
          scheduled_date: serviceRequest.scheduledDate?.toISODate() ?? null,
          scheduled_time: serviceRequest.scheduledTime,
          pickup_location_name: serviceRequest.pickupLocationName,
          pickup_latitude: serviceRequest.pickupLatitude,
          pickup_longitude: serviceRequest.pickupLongitude,
          delivery_location_name: serviceRequest.deliveryLocationName,
          delivery_latitude: serviceRequest.deliveryLatitude,
          delivery_longitude: serviceRequest.deliveryLongitude,
          photos: serializedReq.attachments?.map((a) => a.file_url) || [],
          voice_note_url: serializedReq.voice_note_url,
        },
        my_response:
          myResponse && !isRejectionMarker(myResponse)
            ? serializeRequestResponse(myResponse)
            : null,
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async respond({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const payload = await request.validateUsing(createResponseValidator)
      const validityErrors = offerValidityErrors(payload)
      if (validityErrors) {
        return ApiResponse.error(response, 'Validation failed', validityErrors, 422)
      }

      const serviceRequest = await Request.find(params.requestId)
      if (!serviceRequest || serviceRequest.status !== 'new') {
        return ApiResponse.error(response, 'Request not available for response', undefined, 404)
      }

      const existing = await RequestResponse.query()
        .where('requestId', serviceRequest.id)
        .where('businessUserId', business.id)
        .first()

      if (existing && !isRejectionMarker(existing)) {
        return ApiResponse.error(response, 'You have already responded to this request', undefined, 422)
      }

      if (existing && isRejectionMarker(existing)) {
        await existing.delete()
      }

      const attachmentFile = request.file('attachment', RESPONSE_ATTACHMENT_OPTIONS)
      const attachmentErrors = validateFile(
        attachmentFile,
        'attachment',
        RESPONSE_ATTACHMENT_OPTIONS,
        false
      )
      if (attachmentErrors) {
        return ApiResponse.error(response, 'Validation failed', attachmentErrors, 422)
      }

      const requestResponse = await db.transaction(async (trx) => {
        const responseNo = await generateResponseNo(trx)

        const created = await RequestResponse.create(
          {
            responseNo,
            requestId: serviceRequest.id,
            businessUserId: business.id,
            notes: payload.notes ?? null,
            price: String(payload.price),
            offerValidityType: payload.offer_validity_type,
            offerValidUntil: payload.offer_valid_until
              ? DateTime.fromJSDate(payload.offer_valid_until)
              : null,
            attachment: null,
            status: 'pending',
          },
          { client: trx }
        )

        if (attachmentFile) {
          created.attachment = await storeFile(attachmentFile, `responses/${created.id}`)
          created.useTransaction(trx)
          await created.save()
        }

        serviceRequest.status = 'confirmed'
        serviceRequest.useTransaction(trx)
        await serviceRequest.save()

        return created
      })

      const businessProfile = await BusinessProfile.query().where('userId', business.id).first()
      const businessName = businessProfile?.businessName ?? business.name

      await NotificationService.send({
        user_id: serviceRequest.userId,
        title: 'New Offer Received',
        body: `${businessName} sent you an offer for ${serviceRequest.title}`,
        type: NotificationType.NEW_RESPONSE,
        data: {
          request_id: serviceRequest.id,
          response_id: requestResponse.id,
        },
      })

      return ApiResponse.success(
        response,
        {
          response: serializeRequestResponse(requestResponse),
          message: 'Response sent successfully',
        },
        'Response sent successfully',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async updateResponse({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const payload = await request.validateUsing(updateResponseValidator)

      const requestResponse = await RequestResponse.query()
        .where('id', params.responseId)
        .where('requestId', params.requestId)
        .where('businessUserId', business.id)
        .first()

      if (!requestResponse) {
        return ApiResponse.error(response, 'Response not found', undefined, 404)
      }

      const validityType = payload.offer_validity_type ?? requestResponse.offerValidityType
      if (payload.offer_validity_type || payload.offer_valid_until !== undefined) {
        const validityErrors = offerValidityErrors({
          offer_validity_type: validityType,
          offer_valid_until: payload.offer_valid_until,
        })
        if (validityErrors) {
          return ApiResponse.error(response, 'Validation failed', validityErrors, 422)
        }
      }

      if (requestResponse.status !== 'pending') {
        return ApiResponse.error(response, 'Only pending responses can be updated', undefined, 422)
      }

      if (payload.notes !== undefined) requestResponse.notes = payload.notes
      if (payload.price !== undefined) requestResponse.price = String(payload.price)
      if (payload.offer_validity_type !== undefined) {
        requestResponse.offerValidityType = payload.offer_validity_type
      }
      if (payload.offer_valid_until !== undefined) {
        requestResponse.offerValidUntil = payload.offer_valid_until
          ? DateTime.fromJSDate(payload.offer_valid_until)
          : null
      }

      const attachmentFile = request.file('attachment', RESPONSE_ATTACHMENT_OPTIONS)
      const attachmentErrors = validateFile(
        attachmentFile,
        'attachment',
        RESPONSE_ATTACHMENT_OPTIONS,
        false
      )
      if (attachmentErrors) {
        return ApiResponse.error(response, 'Validation failed', attachmentErrors, 422)
      }

      if (attachmentFile) {
        await deleteFileIfExists(requestResponse.attachment)
        requestResponse.attachment = await storeFile(attachmentFile, `responses/${requestResponse.id}`)
      }

      await requestResponse.save()

      return ApiResponse.success(
        response,
        {
          response: serializeRequestResponse(requestResponse),
          message: 'Response updated successfully',
        },
        'Response updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async reject({ auth, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const serviceRequest = await Request.find(params.requestId)

      if (!serviceRequest) {
        return ApiResponse.error(response, 'Request not found', undefined, 404)
      }

      const existing = await RequestResponse.query()
        .where('requestId', serviceRequest.id)
        .where('businessUserId', business.id)
        .first()

      if (existing) {
        if (isRejectionMarker(existing)) {
          return ApiResponse.success(response, { message: 'Request rejected' }, 'Request rejected')
        }
        return ApiResponse.error(response, 'You have already responded to this request', undefined, 422)
      }

      await db.transaction(async (trx) => {
        const responseNo = await generateResponseNo(trx)
        await RequestResponse.create(
          {
            responseNo,
            requestId: serviceRequest.id,
            businessUserId: business.id,
            notes: null,
            price: '0',
            offerValidityType: 'open',
            offerValidUntil: null,
            attachment: null,
            status: 'rejected',
          },
          { client: trx }
        )
      })

      return ApiResponse.success(response, { message: 'Request rejected' }, 'Request rejected')
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
