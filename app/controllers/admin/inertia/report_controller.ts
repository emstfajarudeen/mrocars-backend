import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Order from '#models/order'
import User from '#models/user'
import Request from '#models/request'

export default class ReportController {
  async index({ request, inertia }: HttpContext) {
    const startDateInput = request.input('start_date') as string | undefined
    const endDateInput = request.input('end_date') as string | undefined

    const startDate = startDateInput 
      ? DateTime.fromISO(startDateInput).startOf('day') 
      : DateTime.now().minus({ days: 30 }).startOf('day')
    const endDate = endDateInput 
      ? DateTime.fromISO(endDateInput).endOf('day') 
      : DateTime.now().endOf('day')

    const ordersQuery = Order.query()
      .whereBetween('createdAt', [startDate.toSQL()!, endDate.toSQL()!])
    
    const totalOrdersCount = await ordersQuery.clone().count('* as total')
    const paidOrdersQuery = ordersQuery.clone().where('paymentStatus', 'paid')
    const totalRevenueSum = await paidOrdersQuery.clone().sum('total_amount as total')
    
    const orderCount = Number(totalOrdersCount[0].$extras.total || 0)
    const revenue = Number(totalRevenueSum[0].$extras.total || 0)
    const avgOrderValue = orderCount > 0 ? (revenue / orderCount) : 0

    const usersCount = await User.query()
      .where('role', 'user')
      .whereBetween('createdAt', [startDate.toSQL()!, endDate.toSQL()!])
      .count('* as total')
    
    const businessesCount = await User.query()
      .where('role', 'business')
      .whereBetween('createdAt', [startDate.toSQL()!, endDate.toSQL()!])
      .count('* as total')

    const requestsCount = await Request.query()
      .whereBetween('createdAt', [startDate.toSQL()!, endDate.toSQL()!])
      .count('* as total')

    const trend = await db
      .from('orders')
      .whereBetween('created_at', [startDate.toSQL()!, endDate.toSQL()!])
      .where('payment_status', 'paid')
      .groupByRaw('DATE(created_at)')
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as count'),
        db.raw('SUM(total_amount) as amount')
      )
      .orderBy('date', 'asc')

    return inertia.render('admin/Reports', {
      stats: {
        order_count: orderCount,
        revenue: Math.round(revenue * 1000) / 1000,
        avg_order_value: Math.round(avgOrderValue * 1000) / 1000,
        new_users: Number(usersCount[0].$extras.total || 0),
        new_businesses: Number(businessesCount[0].$extras.total || 0),
        new_requests: Number(requestsCount[0].$extras.total || 0),
      },
      trend: trend.map((t) => {
        // MySQL or other DB platforms date formatting
        let rawDate = t.date;
        if (rawDate instanceof Date) {
          rawDate = DateTime.fromJSDate(rawDate).toISODate()
        }
        return {
          date: String(rawDate),
          count: Number(t.count),
          amount: Number(t.amount || 0),
        }
      }),
      filters: {
        start_date: startDate.toISODate(),
        end_date: endDate.toISODate(),
      },
    })
  }

  async exportCsv({ request, response }: HttpContext) {
    const startDateInput = request.input('start_date') as string | undefined
    const endDateInput = request.input('end_date') as string | undefined

    const startDate = startDateInput 
      ? DateTime.fromISO(startDateInput).startOf('day') 
      : DateTime.now().minus({ days: 30 }).startOf('day')
    const endDate = endDateInput 
      ? DateTime.fromISO(endDateInput).endOf('day') 
      : DateTime.now().endOf('day')

    const orders = await Order.query()
      .whereBetween('createdAt', [startDate.toSQL()!, endDate.toSQL()!])
      .preload('user')
      .orderBy('createdAt', 'desc')

    let csvContent = 'Order No,Customer,Amount,Status,Payment Status,Date\n'
    for (const order of orders) {
      const customerName = order.user?.name ? `"${order.user.name.replace(/"/g, '""')}"` : '—'
      const amount = order.totalAmount
      const status = order.status
      const payStatus = order.paymentStatus
      const date = order.createdAt.toISODate()
      csvContent += `${order.orderNo},${customerName},${amount},${status},${payStatus},${date}\n`
    }

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', `attachment; filename="orders_report_${startDate.toISODate()}_to_${endDate.toISODate()}.csv"`)
    return response.send(csvContent)
  }
}
