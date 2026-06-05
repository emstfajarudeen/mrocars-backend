import type { HttpContext } from '@adonisjs/core/http'
import { getDashboardStats, getRecentActivity } from '#services/admin_panel_service'

export default class DashboardController {
  async index({ inertia }: HttpContext) {
    const [stats, activity] = await Promise.all([getDashboardStats(), getRecentActivity()])

    return inertia.render('admin/Dashboard', { stats, activity })
  }
}
