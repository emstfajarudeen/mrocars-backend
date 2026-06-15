import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import BusinessProfile from '#models/business_profile'
import Order from '#models/order'
import RequestResponse from '#models/request_response'
import User from '#models/user'
import { ApiResponse } from '#helpers/response'
import {
  buildPaginationMeta,
  getPaginationParams,
  isValidationError,
  serializeCategory,
} from '#helpers/masters'
import { parseBooleanQuery } from '#helpers/admin_helper'
import { getBusinessRating } from '#helpers/request_helper'
import { publicUrl, storeFile, validateImageFile } from '#helpers/upload'
import AuthService from '#services/auth_service'
import {
  createBusinessValidator,
  updateBusinessValidator,
} from '#validators/admin/business_validator'

async function findAdminBusiness(id: number) {
  return User.query()
    .where('id', id)
    .where('role', 'business')
    .preload('businessProfile', (profileQuery) => {
      profileQuery.preload('governorate').preload('area')
    })
    .first()
}

function serializeBusinessProfileSummary(profile: BusinessProfile) {
  return {
    business_name: profile.businessName,
    avatar_url: publicUrl(profile.avatar),
    governorate: profile.governorate?.serialize() ?? null,
    area: profile.area?.serialize() ?? null,
    is_approved: profile.isApproved,
  }
}

async function getBusinessListStats(businessUserId: number) {
  const [responsesCount, ordersCount, revenueRow] = await Promise.all([
    db
      .from('request_responses')
      .where('business_user_id', businessUserId)
      .whereNull('deleted_at')
      .count('* as total'),
    db
      .from('orders')
      .where('business_user_id', businessUserId)
      .whereNull('deleted_at')
      .count('* as total'),
    db
      .from('orders')
      .where('business_user_id', businessUserId)
      .whereNull('deleted_at')
      .where('payment_status', 'paid')
      .sum('total_amount as total'),
  ])

  return {
    total_requests_received: Number(responsesCount[0].total),
    total_orders: Number(ordersCount[0].total),
    total_revenue: Number(revenueRow[0]?.total ?? 0),
  }
}

async function getBusinessDetailStats(businessUserId: number) {
  const [requestsReceivedRow, responsesSentRow, ordersCount, revenueRow, rating] =
    await Promise.all([
      db
        .from('request_responses')
        .where('business_user_id', businessUserId)
        .whereNull('deleted_at')
        .countDistinct('request_id as total'),
      db
        .from('request_responses')
        .where('business_user_id', businessUserId)
        .whereNull('deleted_at')
        .count('* as total'),
      db
        .from('orders')
        .where('business_user_id', businessUserId)
        .whereNull('deleted_at')
        .count('* as total'),
      db
        .from('orders')
        .where('business_user_id', businessUserId)
        .whereNull('deleted_at')
        .where('payment_status', 'paid')
        .sum('total_amount as total'),
      getBusinessRating(businessUserId),
    ])

  return {
    total_requests_received: Number(requestsReceivedRow[0].total),
    total_responses_sent: Number(responsesSentRow[0].total),
    total_orders: Number(ordersCount[0].total),
    total_revenue: Number(revenueRow[0]?.total ?? 0),
    average_rating: rating.rating_avg,
    total_reviews: rating.total_reviews,
  }
}

function serializeBusinessListItem(user: User, stats: Awaited<ReturnType<typeof getBusinessListStats>>) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    business_profile: user.businessProfile
      ? serializeBusinessProfileSummary(user.businessProfile)
      : null,
    is_active: user.isActive,
    created_at: user.createdAt,
    ...stats,
  }
}

function serializeBusinessDetail(user: User, stats: Awaited<ReturnType<typeof getBusinessDetailStats>>) {
  return {
    user: {
      ...user.serialize(),
      avatar_url: publicUrl(user.avatar),
    },
    business_profile: user.businessProfile
      ? {
          ...user.businessProfile.serialize(),
          avatar_url: publicUrl(user.businessProfile.avatar),
          governorate: user.businessProfile.governorate?.serialize() ?? null,
          area: user.businessProfile.area?.serialize() ?? null,
        }
      : null,
    stats,
  }
}

export default class BusinessController {
  async index({ request, response }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const isActive = parseBooleanQuery(request.input('is_active'))
    const isApproved = parseBooleanQuery(request.input('is_approved'))

    const query = User.query()
      .where('role', 'business')
      .preload('businessProfile', (profileQuery) => {
        profileQuery.preload('governorate').preload('area')
      })
      .orderBy('createdAt', 'desc')

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query.where((builder) => {
        builder
          .whereILike('name', term)
          .orWhereILike('email', term)
          .orWhereILike('phoneNumber', term)
          .orWhereHas('businessProfile', (profileQuery) => {
            profileQuery.whereILike('businessName', term)
          })
      })
    }

    if (isActive !== undefined) {
      query.where('isActive', isActive)
    }

    if (isApproved !== undefined) {
      query.whereHas('businessProfile', (profileQuery) => {
        profileQuery.where('isApproved', isApproved)
      })
    }

    const paginated = await query.paginate(page, limit)

    const data = await Promise.all(
      paginated.all().map(async (user) => {
        const stats = await getBusinessListStats(user.id)
        return serializeBusinessListItem(user, stats)
      })
    )

    return ApiResponse.success(response, {
      data,
      meta: buildPaginationMeta(paginated),
    })
  }

  async show({ params, response }: HttpContext) {
    const user = await findAdminBusiness(Number(params.id))

    if (!user) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    const stats = await getBusinessDetailStats(user.id)

    return ApiResponse.success(response, {
      business: serializeBusinessDetail(user, stats),
    })
  }

  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createBusinessValidator)

      const existing = await User.query().where('email', payload.email).first()
      if (existing) {
        return ApiResponse.error(
          response,
          'Email already registered',
          { email: ['Email already registered'] },
          422
        )
      }

      const avatarFile = request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (avatarFile) {
        const fileErrors = validateImageFile(avatarFile, 'avatar')
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
      }

      const businessUser = await db.transaction(async (trx) => {
        const user = await User.create(
          {
            name: payload.name,
            email: payload.email,
            phoneCode: payload.phone_code,
            phoneNumber: payload.phone_number,
            password: payload.password,
            role: 'business',
            language: 'en',
            isActive: true,
          },
          { client: trx }
        )

        let avatarPath = null
        if (avatarFile) {
          avatarPath = await storeFile(avatarFile, `business/avatars/${user.id}`)
        }

        await BusinessProfile.create(
          {
            userId: user.id,
            businessName: payload.business_name,
            email: payload.email,
            phoneCode: payload.phone_code,
            phoneNumber: payload.phone_number,
            avatar: avatarPath,
            isApproved: payload.is_approved ?? true,

            // Address Details
            addressLabel: payload.address_label ?? null,
            governorateId: payload.governorate_id ?? null,
            areaId: payload.area_id ?? null,
            block: payload.block ?? null,
            street: payload.street ?? null,
            buildingName: payload.building_name ?? null,
            buildingNo: payload.building_no ?? null,
            floorNo: payload.floor_no ?? null,
            shopNo: payload.shop_no ?? null,
            latitude: payload.latitude !== undefined ? String(payload.latitude) : null,
            longitude: payload.longitude !== undefined ? String(payload.longitude) : null,

            // Bank Details
            bankName: payload.bank_name ?? null,
            accountName: payload.account_name ?? null,
            iban: payload.iban ?? null,
          },
          { client: trx }
        )

        return user
      })

      await businessUser.load('businessProfile', (profileQuery) => {
        profileQuery.preload('governorate').preload('area')
      })

      const stats = await getBusinessDetailStats(businessUser.id)

      return ApiResponse.success(
        response,
        {
          business: serializeBusinessDetail(businessUser, stats),
          message: 'Business account created',
        },
        'Business account created',
        201
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const user = await findAdminBusiness(Number(params.id))

      if (!user || !user.businessProfile) {
        return ApiResponse.error(response, 'Business not found', undefined, 404)
      }

      const payload = await request.validateUsing(updateBusinessValidator)

      if (payload.email && payload.email !== user.email) {
        const existing = await User.query().where('email', payload.email).whereNot('id', user.id).first()
        if (existing) {
          return ApiResponse.error(
            response,
            'Email already registered',
            { email: ['Email already registered'] },
            422
          )
        }
      }

      if (payload.name !== undefined) user.name = payload.name
      if (payload.email !== undefined) user.email = payload.email
      if (payload.phone_code !== undefined) user.phoneCode = payload.phone_code
      if (payload.phone_number !== undefined) user.phoneNumber = payload.phone_number

      const profile = user.businessProfile
      if (payload.business_name !== undefined) profile.businessName = payload.business_name
      if (payload.is_approved !== undefined) profile.isApproved = payload.is_approved
      if (payload.email !== undefined) profile.email = payload.email
      if (payload.phone_code !== undefined) profile.phoneCode = payload.phone_code
      if (payload.phone_number !== undefined) profile.phoneNumber = payload.phone_number

      await user.save()
      await profile.save()

      const stats = await getBusinessDetailStats(user.id)

      return ApiResponse.success(
        response,
        {
          business: serializeBusinessDetail(user, stats),
          message: 'Business updated successfully',
        },
        'Business updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async toggleStatus({ params, response }: HttpContext) {
    const user = await User.query().where('id', params.id).where('role', 'business').first()

    if (!user) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    user.isActive = !user.isActive
    await user.save()

    if (!user.isActive) {
      await AuthService.revokeToken(user.id)
    }

    return ApiResponse.success(
      response,
      { message: 'Business status updated', is_active: user.isActive },
      'Business status updated'
    )
  }

  async toggleApproval({ params, response }: HttpContext) {
    const profile = await BusinessProfile.query().where('userId', params.id).first()

    if (!profile) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    profile.isApproved = !profile.isApproved
    await profile.save()

    return ApiResponse.success(
      response,
      { message: 'Business approval updated', is_approved: profile.isApproved },
      'Business approval updated'
    )
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .where('role', 'business')
      .preload('businessProfile')
      .first()

    if (!user) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    await AuthService.revokeToken(user.id)

    if (user.businessProfile) {
      await user.businessProfile.delete()
    }

    await user.delete()

    return ApiResponse.success(
      response,
      { message: 'Business deleted successfully' },
      'Business deleted successfully'
    )
  }

  async orders({ params, request, response }: HttpContext) {
    const user = await User.query().where('id', params.id).where('role', 'business').first()

    if (!user) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    const { page, limit } = getPaginationParams(request)
    const status = request.input('status') as string | undefined

    const query = Order.query()
      .where('businessUserId', user.id)
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const paginated = await query
      .preload('user')
      .preload('request', (requestQuery) => {
        requestQuery.preload('category')
      })
      .paginate(page, limit)

    const data = paginated.all().map((order) => ({
      order_no: order.orderNo,
      user: order.user ? { name: order.user.name } : null,
      request: order.request
        ? {
            category: order.request.category ? serializeCategory(order.request.category) : null,
            title: order.request.title,
          }
        : null,
      total_amount: order.totalAmount,
      status: order.status,
      payment_status: order.paymentStatus,
      created_at: order.createdAt,
    }))

    return ApiResponse.success(response, {
      data,
      meta: buildPaginationMeta(paginated),
    })
  }

  async requests({ params, request, response }: HttpContext) {
    const user = await User.query().where('id', params.id).where('role', 'business').first()

    if (!user) {
      return ApiResponse.error(response, 'Business not found', undefined, 404)
    }

    const { page, limit } = getPaginationParams(request)
    const status = request.input('status') as string | undefined

    const query = RequestResponse.query()
      .where('businessUserId', user.id)
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const paginated = await query
      .preload('request', (requestQuery) => {
        requestQuery.preload('category')
        requestQuery.preload('user')
      })
      .paginate(page, limit)

    const data = paginated.all().map((item) => ({
      response_no: item.responseNo,
      request: item.request
        ? {
            request_no: item.request.requestNo,
            title: item.request.title,
            category: item.request.category ? serializeCategory(item.request.category) : null,
          }
        : null,
      user: item.request?.user ? { name: item.request.user.name } : null,
      price: item.price,
      status: item.status,
      created_at: item.createdAt,
    }))

    return ApiResponse.success(response, {
      data,
      meta: buildPaginationMeta(paginated),
    })
  }
}
