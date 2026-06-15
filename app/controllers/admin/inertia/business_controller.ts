import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import RequestResponse from '#models/request_response'
import User from '#models/user'
import Governorate from '#models/governorate'
import Area from '#models/area'
import { buildPaginationMeta, getPaginationParams, serializeCategory } from '#helpers/masters'
import { parseBooleanQuery } from '#helpers/admin_helper'
import { getBusinessRating } from '#helpers/request_helper'
import { publicUrl } from '#helpers/upload'

async function findAdminBusiness(id: number) {
  return User.query()
    .where('id', id)
    .where('role', 'business')
    .preload('businessProfile', (profileQuery) => {
      profileQuery.preload('governorate').preload('area')
    })
    .first()
}

function serializeBusinessProfileSummary(profile: NonNullable<User['businessProfile']>) {
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

function serializeBusinessListItem(
  user: User,
  stats: Awaited<ReturnType<typeof getBusinessListStats>>
) {
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

function serializeBusinessDetail(
  user: User,
  stats: Awaited<ReturnType<typeof getBusinessDetailStats>>
) {
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
  async index({ request, inertia }: HttpContext) {
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

    const businesses = await Promise.all(
      paginated.all().map(async (user) => {
        const stats = await getBusinessListStats(user.id)
        return serializeBusinessListItem(user, stats)
      })
    )

    return inertia.render('admin/Businesses', {
      businesses,
      meta: buildPaginationMeta(paginated),
      filters: {
        search: search ?? null,
        is_active: isActive ?? null,
        is_approved: isApproved ?? null,
      },
    })
  }

  async show({ params, inertia, response }: HttpContext) {
    const user = await findAdminBusiness(Number(params.id))

    if (!user) {
      return response.redirect('/admin/businesses')
    }

    const stats = await getBusinessDetailStats(user.id)

    const [recentOrders, recentRequests] = await Promise.all([
      Order.query()
        .where('businessUserId', user.id)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .preload('user')
        .preload('request', (requestQuery) => {
          requestQuery.preload('category')
        }),
      RequestResponse.query()
        .where('businessUserId', user.id)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .preload('request', (requestQuery) => {
          requestQuery.preload('category')
          requestQuery.preload('user')
        }),
    ])

    return inertia.render('admin/BusinessDetail', {
      business: serializeBusinessDetail(user, stats),
      recent_orders: recentOrders.map((order) => ({
        id: order.id,
        order_no: order.orderNo,
        user: order.user ? { name: order.user.name } : null,
        request: order.request
          ? {
              title: order.request.title,
              category: order.request.category ? serializeCategory(order.request.category) : null,
            }
          : null,
        total_amount: order.totalAmount,
        status: order.status,
        payment_status: order.paymentStatus,
        created_at: order.createdAt,
      })),
      recent_requests: recentRequests.map((item) => ({
        id: item.id,
        response_no: item.responseNo,
        price: item.price,
        status: item.status,
        request: item.request
          ? {
              request_no: item.request.requestNo,
              title: item.request.title,
              category: item.request.category ? serializeCategory(item.request.category) : null,
              user: item.request.user ? { name: item.request.user.name } : null,
            }
          : null,
        created_at: item.createdAt,
      })),
    })
  }

  async create({ inertia }: HttpContext) {
    const governorates = await Governorate.query().orderBy('nameEn', 'asc')
    const areas = await Area.query().orderBy('nameEn', 'asc')
    return inertia.render('admin/BusinessCreate', {
      governorates: governorates.map((g) => g.serialize()),
      areas: areas.map((a) => a.serialize()),
    })
  }
}
