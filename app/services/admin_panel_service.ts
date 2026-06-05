import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import Request from '#models/request'
import User from '#models/user'
import { serializeCategory } from '#helpers/masters'
import { buildStatusCounts, startOfCurrentMonth, sumStatusCounts } from '#helpers/admin_helper'
import { serializeUserBrief } from '#helpers/request_helper'

const REQUEST_STATUSES = ['new', 'accepted', 'confirmed', 'rejected', 'cancelled']
const ORDER_STATUSES = ['new', 'pending', 'delivered', 'cancelled']

export type DashboardUserStats = {
  total: number
  active: number
  inactive: number
  new_this_month: number
}

export type DashboardBusinessStats = {
  total: number
  active: number
  approved: number
  pending_approval: number
  new_this_month: number
}

export type DashboardRequestStats = {
  total: number
  new: number
  accepted: number
  confirmed: number
  rejected: number
  cancelled: number
  new_this_month: number
}

export type DashboardOrderStats = {
  total: number
  new: number
  pending: number
  delivered: number
  cancelled: number
  new_this_month: number
}

export type DashboardRevenueStats = {
  total_revenue: number
  received_amount: number
  pending_amount: number
  revenue_this_month: number
}

export type DashboardStats = {
  users: DashboardUserStats
  businesses: DashboardBusinessStats
  requests: DashboardRequestStats
  orders: DashboardOrderStats
  revenue: DashboardRevenueStats
}

export type DashboardActivityRequest = {
  id: number
  request_no: string
  title: string
  user: ReturnType<typeof serializeUserBrief> | null
  category: ReturnType<typeof serializeCategory> | null
  created_at: unknown
}

export type DashboardActivityOrder = {
  id: number
  order_no: string
  user: ReturnType<typeof serializeUserBrief> | null
  business: { business_name: string } | null
  total_amount: string
  created_at: unknown
}

export type DashboardActivityBusiness = {
  id: number
  name: string
  email: string
  business_name: string | null
  created_at: unknown
}

export type DashboardActivityUser = {
  id: number
  name: string
  email: string
  created_at: unknown
}

export type DashboardActivity = {
  recent_requests: DashboardActivityRequest[]
  recent_orders: DashboardActivityOrder[]
  recent_businesses: DashboardActivityBusiness[]
  recent_users: DashboardActivityUser[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const monthStart = startOfCurrentMonth()

  const [
    userTotal,
    userActive,
    userInactive,
    userNewThisMonth,
    businessTotal,
    businessActive,
    businessApproved,
    businessPendingApproval,
    businessNewThisMonth,
    requestStatusRows,
    requestNewThisMonth,
    orderStatusRows,
    orderNewThisMonth,
    revenueRow,
    pendingRow,
    revenueThisMonthRow,
  ] = await Promise.all([
    db.from('users').where('role', 'user').whereNull('deleted_at').count('* as total'),
    db.from('users').where('role', 'user').whereNull('deleted_at').where('is_active', true).count('* as total'),
    db.from('users').where('role', 'user').whereNull('deleted_at').where('is_active', false).count('* as total'),
    db
      .from('users')
      .where('role', 'user')
      .whereNull('deleted_at')
      .where('created_at', '>=', monthStart)
      .count('* as total'),
    db.from('users').where('role', 'business').whereNull('deleted_at').count('* as total'),
    db
      .from('users')
      .where('role', 'business')
      .whereNull('deleted_at')
      .where('is_active', true)
      .count('* as total'),
    db
      .from('business_profiles')
      .whereNull('deleted_at')
      .where('is_approved', true)
      .count('* as total'),
    db
      .from('business_profiles')
      .whereNull('deleted_at')
      .where('is_approved', false)
      .count('* as total'),
    db
      .from('users')
      .where('role', 'business')
      .whereNull('deleted_at')
      .where('created_at', '>=', monthStart)
      .count('* as total'),
    db
      .from('requests')
      .whereNull('deleted_at')
      .select('status')
      .count('* as count')
      .groupBy('status'),
    db
      .from('requests')
      .whereNull('deleted_at')
      .where('created_at', '>=', monthStart)
      .count('* as total'),
    db
      .from('orders')
      .whereNull('deleted_at')
      .select('status')
      .count('* as count')
      .groupBy('status'),
    db
      .from('orders')
      .whereNull('deleted_at')
      .where('created_at', '>=', monthStart)
      .count('* as total'),
    db
      .from('orders')
      .whereNull('deleted_at')
      .where('payment_status', 'paid')
      .sum('total_amount as total'),
    db
      .from('orders')
      .whereNull('deleted_at')
      .where('payment_status', 'unpaid')
      .sum('total_amount as total'),
    db
      .from('orders')
      .whereNull('deleted_at')
      .where('payment_status', 'paid')
      .where('created_at', '>=', monthStart)
      .sum('total_amount as total'),
  ])

  const requestsByStatus = buildStatusCounts(
    requestStatusRows as { status: string; count: number }[],
    REQUEST_STATUSES
  )
  const ordersByStatus = buildStatusCounts(
    orderStatusRows as { status: string; count: number }[],
    ORDER_STATUSES
  )

  const totalRevenue = Number(revenueRow[0]?.total ?? 0)

  return {
    users: {
      total: Number(userTotal[0].total),
      active: Number(userActive[0].total),
      inactive: Number(userInactive[0].total),
      new_this_month: Number(userNewThisMonth[0].total),
    },
    businesses: {
      total: Number(businessTotal[0].total),
      active: Number(businessActive[0].total),
      approved: Number(businessApproved[0].total),
      pending_approval: Number(businessPendingApproval[0].total),
      new_this_month: Number(businessNewThisMonth[0].total),
    },
    requests: {
      total: sumStatusCounts(requestsByStatus),
      ...requestsByStatus,
      new_this_month: Number(requestNewThisMonth[0].total),
    } as DashboardRequestStats,
    orders: {
      total: sumStatusCounts(ordersByStatus),
      ...ordersByStatus,
      new_this_month: Number(orderNewThisMonth[0].total),
    } as DashboardOrderStats,
    revenue: {
      total_revenue: totalRevenue,
      received_amount: totalRevenue,
      pending_amount: Number(pendingRow[0]?.total ?? 0),
      revenue_this_month: Number(revenueThisMonthRow[0]?.total ?? 0),
    },
  }
}

export async function getRecentActivity(): Promise<DashboardActivity> {
  const recentRequests = await Request.query()
    .orderBy('createdAt', 'desc')
    .limit(5)
    .preload('user')
    .preload('category')

  const recentOrders = await Order.query()
    .orderBy('createdAt', 'desc')
    .limit(5)
    .preload('user')
    .preload('businessUser', (businessQuery) => {
      businessQuery.preload('businessProfile')
    })

  const recentBusinesses = await User.query()
    .where('role', 'business')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .preload('businessProfile')

  const recentUsers = await User.query()
    .where('role', 'user')
    .orderBy('createdAt', 'desc')
    .limit(5)

  return {
    recent_requests: recentRequests.map((item) => ({
      id: item.id,
      request_no: item.requestNo,
      title: item.title,
      user: item.user ? serializeUserBrief(item.user) : null,
      category: item.category ? serializeCategory(item.category) : null,
      created_at: item.createdAt,
    })),
    recent_orders: recentOrders.map((order) => ({
      id: order.id,
      order_no: order.orderNo,
      user: order.user ? serializeUserBrief(order.user) : null,
      business: order.businessUser?.businessProfile
        ? { business_name: order.businessUser.businessProfile.businessName }
        : null,
      total_amount: order.totalAmount,
      created_at: order.createdAt,
    })),
    recent_businesses: recentBusinesses.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      business_name: user.businessProfile?.businessName ?? null,
      created_at: user.createdAt,
    })),
    recent_users: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    })),
  }
}
