import type { HttpContext } from '@adonisjs/core/http'
import type { UserLanguage } from '#types/user'
import Order from '#models/order'
import OrderAdditionalWork from '#models/order_additional_work'
import { ApiResponse } from '#helpers/response'
import {
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import {
  findBusinessOrder,
  serializeOrder,
  serializeOrderAdditionalWork,
  serializeUserWithPhone,
  resolveCategoryId,
} from '#helpers/request_helper'
import { deleteFileIfExists, storeFile, validateFile, publicUrl } from '#helpers/upload'
import {
  createAdditionalWorkValidator,
  updateAdditionalWorkValidator,
  updateOrderStatusValidator,
} from '#validators/business/order_validator'
import NotificationService, { NotificationType } from '#services/notification_service'

const VOICE_NOTE_OPTIONS = {
  size: '10mb' as const,
  extnames: ['mp3', 'mp4', 'wav', 'm4a'],
}

const ATTACHMENT_OPTIONS = {
  size: '5mb' as const,
  extnames: ['jpg', 'jpeg', 'png'],
}

const STATUS_FLOW: Record<string, string[]> = {
  new: ['pending'],
  pending: ['delivered'],
  delivered: [],
  cancelled: [],
}

function businessOrderDetailQuery() {
  return Order.query()
    .preload('request', (requestQuery) => {
      requestQuery
        .preload('category')
        .preload('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand').preload('carModel')
        })
        .preload('attachments')
    })
    .preload('requestResponse')
    .preload('user')
    .preload('deliveryAddress', (addressQuery) => {
      addressQuery.preload('governorate').preload('area')
    })
    .preload('additionalWorks')
    .preload('rating')
}

function serializeBusinessOrderDetail(order: Order, language: UserLanguage = 'en') {
  const user = order.user
    ? {
        name: order.user.name,
        avatar: order.user.avatar ? publicUrl(order.user.avatar) : null,
      }
    : null

  const category = order.request?.category
    ? (language === 'ar' ? order.request.category.nameAr : order.request.category.nameEn)
    : null

  const vehicle = order.request?.userVehicle
    ? {
        id: order.request.userVehicle.id,
        brand: order.request.userVehicle.carBrand?.name || null,
        model: order.request.userVehicle.carModel?.name || null,
        year: order.request.userVehicle.year || null,
      }
    : null

  const attachments = (order.request?.attachments || []).map((att: any) => publicUrl(att.filePath)).filter(Boolean)
  const voiceNoteUrl = order.request?.voiceNote ? publicUrl(order.request.voiceNote) : null

  const request = order.request
    ? {
        category,
        vehicle,
        no_of_tyres: order.request.noOfTyres,
        when_needed: order.request.whenNeeded,
        pickup_location_name: order.request.pickupLocationName,
        pickup_latitude: order.request.pickupLatitude,
        pickup_longitude: order.request.pickupLongitude,
        delivery_location_name: order.request.deliveryLocationName,
        delivery_latitude: order.request.deliveryLatitude,
        delivery_longitude: order.request.deliveryLongitude,
        description: order.request.description,
        voice_note_url: voiceNoteUrl,
        attachments,
      }
    : null

  const address = order.deliveryAddress as any
  const deliveryAddress = address
    ? {
        governorate: address.governorate
          ? (language === 'ar' ? address.governorate.nameAr : address.governorate.nameEn)
          : null,
        area: address.area
          ? (language === 'ar' ? address.area.nameAr : address.area.nameEn)
          : null,
        block: address.block,
        street: address.street,
        building_name: address.buildingName,
        building_no: address.buildingNo,
        floor_no: address.floorNo,
        shop_no: address.shopNo,
        latitude: address.latitude ? Number(address.latitude) : null,
        longitude: address.longitude ? Number(address.longitude) : null,
        phone_code: address.recipientPhoneCode,
        phone_number: address.recipientPhoneNumber,
      }
    : null

  return {
    order_no: order.orderNo,
    created_at: order.createdAt?.toISO() ?? null,
    user,
    request,
    delivery_address: deliveryAddress,
    parts_price: order.partsPrice,
    payment_status: order.paymentStatus,
    status: order.status,
  }
}

export default class OrderController {
  async index({ auth, request, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const { page, limit } = getPaginationParams(request)
      const status = request.input('status') as string | undefined

      const categoryInput = request.input('category_id') as string | number | undefined

      const query = Order.query()
        .where('businessUserId', business.id)
        .orderBy('createdAt', 'desc')

      if (status) {
        query.where('status', status)
      }

      const categoryId = await resolveCategoryId(categoryInput)
      if (categoryInput !== undefined && categoryId === null) {
        return ApiResponse.error(response, 'Category not found', undefined, 404)
      }
      if (categoryId) {
        query.whereHas('request', (requestQuery) => {
          requestQuery.where('categoryId', categoryId)
        })
      }

      const paginated = await query
        .preload('user')
        .preload('request', (requestQuery) => {
          requestQuery.preload('category').preload('userVehicle', (vehicleQuery) => {
            vehicleQuery.preload('carBrand').preload('carModel')
          })
        })
        .paginate(page, limit)

      const data = paginated.all().map((order) => ({
        ...serializeOrder(order, { language: business.language }),
        user: order.user ? serializeUserWithPhone(order.user) : null,
      }))

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
      const order = await businessOrderDetailQuery()
        .where('id', params.id)
        .where('businessUserId', business.id)
        .first()

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      return ApiResponse.success(response, { order: serializeBusinessOrderDetail(order, business.language) })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async updateStatus({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const payload = await request.validateUsing(updateOrderStatusValidator)
      const order = await findBusinessOrder(business.id, Number(params.id))

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      const allowedNext = STATUS_FLOW[order.status] ?? []
      if (!allowedNext.includes(payload.status)) {
        return ApiResponse.error(
          response,
          `Cannot change status from ${order.status} to ${payload.status}`,
          undefined,
          422
        )
      }

      order.status = payload.status
      await order.save()

      await order.load('user')
      await order.load('request', (requestQuery) => {
        requestQuery.preload('category')
      })

      await NotificationService.send({
        user_id: order.userId,
        title: `Order ${payload.status}`,
        body: `Your order ${order.orderNo} is now ${payload.status}`,
        type: NotificationType.ORDER_STATUS_UPDATED,
        data: {
          order_id: order.id,
          order_no: order.orderNo,
          status: payload.status,
        },
      })

      return ApiResponse.success(
        response,
        {
          order_id: order.id,
          request_id: order.requestId,
        },
        'Order status updated'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async addAdditionalWork({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const payload = await request.validateUsing(createAdditionalWorkValidator)
      const order = await findBusinessOrder(business.id, Number(params.id))

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      if (order.status !== 'new' && order.status !== 'pending') {
        return ApiResponse.error(
          response,
          'Additional work can only be added to new or pending orders',
          undefined,
          422
        )
      }

      const voiceNoteFile = request.file('voice_note', VOICE_NOTE_OPTIONS)
      const voiceErrors = validateFile(voiceNoteFile, 'voice_note', VOICE_NOTE_OPTIONS, false)
      if (voiceErrors) {
        return ApiResponse.error(response, 'Validation failed', voiceErrors, 422)
      }

      const attachmentFiles = request.files('attachments', ATTACHMENT_OPTIONS)
      for (const [index, file] of attachmentFiles.entries()) {
        const fileErrors = validateFile(file, `attachments[${index}]`, ATTACHMENT_OPTIONS, false)
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
      }

      const work = await OrderAdditionalWork.create({
        orderId: order.id,
        notes: payload.notes ?? null,
        voiceNote: null,
        price: String(payload.price),
        attachments: [],
        status: 'pending',
        paymentStatus: 'unpaid',
      })

      if (voiceNoteFile) {
        work.voiceNote = await storeFile(
          voiceNoteFile,
          `additional-works/voice-notes/${order.id}`
        )
      }

      if (attachmentFiles.length > 0) {
        const stored = await Promise.all(
          attachmentFiles.map((file) => storeFile(file, `additional-works/attachments/${order.id}`))
        )
        work.attachments = stored
      }

      if (voiceNoteFile || attachmentFiles.length > 0) {
        await work.save()
      }

      await order.load('user')
      await order.load('businessUser', (businessQuery) => {
        businessQuery.preload('businessProfile')
      })

      const businessName =
        order.businessUser?.businessProfile?.businessName ?? order.businessUser?.name ?? 'Business'

      await NotificationService.send({
        user_id: order.userId,
        title: 'Additional Work Requested',
        body: `${businessName} has requested additional work for ${order.orderNo}`,
        type: NotificationType.ADDITIONAL_WORK_REQUESTED,
        data: {
          order_id: order.id,
          additional_work_id: work.id,
        },
      })

      return ApiResponse.success(
        response,
        {
          additional_work_id: work.id,
          order_id: order.id,
        },
        'Additional work sent',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async additionalWorks({ auth, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const order = await findBusinessOrder(business.id, Number(params.id))

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      const works = await OrderAdditionalWork.query()
        .where('orderId', order.id)
        .orderBy('createdAt', 'asc')

      return ApiResponse.success(response, {
        additional_works: works.map((work) => serializeOrderAdditionalWork(work)),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async updateAdditionalWork({ auth, request, params, response }: HttpContext) {
    try {
      const business = auth.getUserOrFail()
      const payload = await request.validateUsing(updateAdditionalWorkValidator)
      const order = await findBusinessOrder(business.id, Number(params.id))

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      const work = await OrderAdditionalWork.query()
        .where('id', params.workId)
        .where('orderId', order.id)
        .first()

      if (!work) {
        return ApiResponse.error(response, 'Additional work not found', undefined, 404)
      }

      if (work.status !== 'pending') {
        return ApiResponse.error(response, 'Only pending works can be updated', undefined, 422)
      }

      if (payload.notes !== undefined) work.notes = payload.notes
      if (payload.price !== undefined) work.price = String(payload.price)

      const voiceNoteFile = request.file('voice_note', VOICE_NOTE_OPTIONS)
      const voiceErrors = validateFile(voiceNoteFile, 'voice_note', VOICE_NOTE_OPTIONS, false)
      if (voiceErrors) {
        return ApiResponse.error(response, 'Validation failed', voiceErrors, 422)
      }

      const attachmentFiles = request.files('attachments', ATTACHMENT_OPTIONS)
      for (const [index, file] of attachmentFiles.entries()) {
        const fileErrors = validateFile(file, `attachments[${index}]`, ATTACHMENT_OPTIONS, false)
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
      }

      if (voiceNoteFile) {
        await deleteFileIfExists(work.voiceNote)
        work.voiceNote = await storeFile(voiceNoteFile, `additional-works/voice-notes/${order.id}`)
      }

      if (attachmentFiles.length > 0) {
        if (work.attachments && work.attachments.length > 0) {
          await Promise.all(work.attachments.map((file) => deleteFileIfExists(file)))
        }
        const stored = await Promise.all(
          attachmentFiles.map((file) => storeFile(file, `additional-works/attachments/${order.id}`))
        )
        work.attachments = stored
      }

      await work.save()

      return ApiResponse.success(
        response,
        {
          additional_work_id: work.id,
          order_id: order.id,
        },
        'Updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
