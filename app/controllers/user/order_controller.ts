import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import OrderAdditionalWork from '#models/order_additional_work'
import OrderRating from '#models/order_rating'
import RequestResponse from '#models/request_response'
import UserAddress from '#models/user_address'
import { ApiResponse } from '#helpers/response'
import {
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
} from '#helpers/masters'
import {
  DELIVERY_FEE,
  PLATFORM_FEE,
  findOwnedOrder,
  generateOrderNo,
  resolveCategoryId,
  serializeOrder,
  serializeOrderAdditionalWork,
} from '#helpers/request_helper'
import {
  createOrderValidator,
  rateOrderValidator,
  respondAdditionalWorkValidator,
} from '#validators/user/order_validator'
import NotificationService, { NotificationType } from '#services/notification_service'

function orderDetailQuery() {
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
    .preload('businessUser', (businessQuery) => {
      businessQuery.preload('businessProfile', (profileQuery) => {
        profileQuery.preload('governorate').preload('area')
      })
    })
    .preload('deliveryAddress', (addressQuery) => {
      addressQuery.preload('governorate').preload('area')
    })
    .preload('additionalWorks')
    .preload('rating')
}

export default class OrderController {
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createOrderValidator)

      const requestResponse = await RequestResponse.query()
        .where('id', payload.request_response_id)
        .preload('request')
        .first()

      if (
        !requestResponse ||
        requestResponse.status !== 'accepted' ||
        requestResponse.request?.userId !== user.id
      ) {
        return ApiResponse.error(response, 'Invalid or unavailable response', undefined, 404)
      }

      const existingOrder = await Order.query()
        .where('requestResponseId', requestResponse.id)
        .first()

      if (existingOrder) {
        return ApiResponse.error(response, 'Order already exists for this response', undefined, 422)
      }

      const deliveryAddress = await UserAddress.query()
        .where('id', payload.delivery_address_id)
        .where('userId', user.id)
        .first()

      if (!deliveryAddress) {
        return ApiResponse.error(response, 'Delivery address not found', undefined, 404)
      }

      const partsPrice = requestResponse.price
      const deliveryFee = DELIVERY_FEE
      const platformFee = PLATFORM_FEE
      const totalAmount = (
        Number(partsPrice) + Number(deliveryFee) + Number(platformFee)
      ).toFixed(3)

      const order = await db.transaction(async (trx) => {
        const orderNo = await generateOrderNo(trx)

        const created = await Order.create(
          {
            orderNo,
            requestId: requestResponse.requestId,
            requestResponseId: requestResponse.id,
            userId: user.id,
            businessUserId: requestResponse.businessUserId,
            partsPrice,
            deliveryFee,
            platformFee,
            totalAmount,
            paymentMethod: payload.payment_method,
            // TODO: integrate real payment gateway
            paymentStatus: 'paid',
            deliveryAddressId: deliveryAddress.id,
            status: 'new',
          },
          { client: trx }
        )

        if (requestResponse.request) {
          requestResponse.request.status = 'confirmed'
          requestResponse.request.useTransaction(trx)
          await requestResponse.request.save()
        }

        return created
      })

      await order.load('request', (requestQuery) => {
        requestQuery.preload('category')
      })
      if (order.request) {
        await order.request.load('userVehicle', (vehicleQuery) => {
          vehicleQuery.preload('carBrand')
          vehicleQuery.preload('carModel')
        })
      }
      await order.load('businessUser', (businessQuery) => {
        businessQuery.preload('businessProfile')
      })

      await NotificationService.send({
        user_id: order.businessUserId,
        title: 'New Order Received',
        body: `You have a new order ${order.orderNo} from ${user.name}`,
        type: NotificationType.ORDER_PLACED,
        data: {
          order_id: order.id,
          order_no: order.orderNo,
        },
      })

      return ApiResponse.success(
        response,
        {
          order: serializeOrder(order, { language: user.language }),
          message: 'Order placed successfully',
        },
        'Order placed successfully',
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

      const query = Order.query().where('userId', user.id).orderBy('createdAt', 'desc')

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
        .preload('request', (requestQuery) => {
          requestQuery.preload('category').preload('userVehicle', (vehicleQuery) => {
            vehicleQuery.preload('carBrand').preload('carModel')
          })
        })
        .preload('businessUser', (businessQuery) => {
          businessQuery.preload('businessProfile')
        })
        .paginate(page, limit)

      const data = paginated.all().map((order) => serializeOrder(order, { language: user.language }))

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
      const user = auth.getUserOrFail()
      const order = await orderDetailQuery()
        .where('id', params.id)
        .where('userId', user.id)
        .first()

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      return ApiResponse.success(response, { order: serializeOrder(order, { language: user.language }) })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async rate({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(rateOrderValidator)
      const order = await findOwnedOrder(user.id, Number(params.id))

      if (!order) {
        return ApiResponse.error(response, 'Order not found', undefined, 404)
      }

      if (order.status !== 'delivered') {
        return ApiResponse.error(response, 'Only delivered orders can be rated', undefined, 422)
      }

      const existingRating = await OrderRating.query().where('orderId', order.id).first()
      if (existingRating) {
        return ApiResponse.error(response, 'Order already rated', undefined, 422)
      }

      await OrderRating.create({
        orderId: order.id,
        userId: user.id,
        businessUserId: order.businessUserId,
        rating: payload.rating,
      })

      return ApiResponse.success(
        response,
        { message: 'Thank you for your rating' },
        'Thank you for your rating'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async additionalWorks({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const order = await findOwnedOrder(user.id, Number(params.id))

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

  async respondToAdditionalWork({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(respondAdditionalWorkValidator)
      const order = await findOwnedOrder(user.id, Number(params.id))

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
        return ApiResponse.error(response, 'This work has already been responded to', undefined, 422)
      }

      work.status = payload.action === 'accept' ? 'accepted' : 'rejected'

      if (payload.action === 'accept') {
        // TODO: integrate real payment gateway — set unpaid until paid
        work.paymentStatus = 'paid'
      }

      await work.save()

      await NotificationService.send({
        user_id: order.businessUserId,
        title: `Additional Work ${work.status}`,
        body: `${user.name} ${payload.action === 'accept' ? 'accepted' : 'rejected'} the additional work`,
        type: NotificationType.ADDITIONAL_WORK_RESPONDED,
        data: {
          order_id: order.id,
          additional_work_id: work.id,
        },
      })

      return ApiResponse.success(
        response,
        {
          additional_work: serializeOrderAdditionalWork(work),
          message: `Additional work ${payload.action}ed`,
        },
        `Additional work ${payload.action}ed`
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
