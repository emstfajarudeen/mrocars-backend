import type { HttpContext } from '@adonisjs/core/http'
import Enquiry from '#models/enquiry'
import { buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import { ApiResponse } from '#helpers/response'

export default class EnquiryController {
  async index({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const search = request.input('search') as string | undefined
    const appType = request.input('app_type') as string | undefined
    const status = request.input('status') as string | undefined

    const query = Enquiry.query().preload('user').orderBy('createdAt', 'desc')

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query.where((builder) => {
        builder
          .whereILike('name', term)
          .orWhereILike('email', term)
          .orWhereILike('subject', term)
          .orWhereILike('message', term)
      })
    }

    if (appType) {
      query.where('appType', appType)
    }

    if (status) {
      query.where('status', status)
    }

    const paginated = await query.paginate(page, limit)

    return inertia.render('admin/Enquiries', {
      enquiries: paginated.all().map((e) => ({
        id: e.id,
        user_id: e.userId,
        app_type: e.appType,
        name: e.name,
        email: e.email,
        subject: e.subject,
        message: e.message,
        status: e.status,
        created_at: e.createdAt,
        user: e.user ? { id: e.user.id, name: e.user.name, email: e.user.email } : null,
      })),
      meta: buildPaginationMeta(paginated),
      filters: {
        search: search ?? null,
        app_type: appType ?? null,
        status: status ?? null,
      },
    })
  }

  async resolve({ params, response }: HttpContext) {
    try {
      const enquiry = await Enquiry.findOrFail(params.id)
      enquiry.status = enquiry.status === 'resolved' ? 'pending' : 'resolved'
      await enquiry.save()

      return ApiResponse.success(response, { message: 'Enquiry updated successfully', enquiry: enquiry.serialize() })
    } catch {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const enquiry = await Enquiry.findOrFail(params.id)
      await enquiry.delete()

      return ApiResponse.success(response, { message: 'Enquiry deleted successfully' })
    } catch {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
