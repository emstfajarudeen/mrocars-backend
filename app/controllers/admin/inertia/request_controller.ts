import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Request from '#models/request'
import { buildPaginationMeta, getPaginationParams } from '#helpers/masters'
import {
  enrichResponseWithRating,
  resolveCategoryId,
  serializeRequest,
} from '#helpers/request_helper'

export default class RequestController {
  async index({ request, inertia }: HttpContext) {
    const { page, limit } = getPaginationParams(request)
    const status = request.input('status') as string | undefined
    const categoryInput = request.input('category_id') as string | number | undefined
    const search = request.input('search') as string | undefined
    const dateFrom = request.input('date_from') as string | undefined
    const dateTo = request.input('date_to') as string | undefined

    const query = Request.query().orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    const categoryId = await resolveCategoryId(categoryInput)
    if (categoryId) {
      query.where('categoryId', categoryId)
    }

    if (dateFrom) {
      const from = DateTime.fromISO(dateFrom).startOf('day')
      if (from.isValid) {
        query.where('createdAt', '>=', from.toSQL()!)
      }
    }

    if (dateTo) {
      const to = DateTime.fromISO(dateTo).endOf('day')
      if (to.isValid) {
        query.where('createdAt', '<=', to.toSQL()!)
      }
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`
      query.where((builder) => {
        builder
          .whereILike('requestNo', term)
          .orWhereHas('user', (userQuery) => {
            userQuery.whereILike('name', term)
          })
      })
    }

    const paginated = await query
      .preload('category')
      .preload('user')
      .preload('userVehicle', (vehicleQuery) => {
        vehicleQuery.preload('carBrand').preload('carModel')
      })
      .withCount('responses')
      .paginate(page, limit)

    return inertia.render('admin/Requests', {
      requests: paginated.all().map((item) =>
        serializeRequest(item, {
          responsesCount: Number(item.$extras.responses_count ?? 0),
        })
      ),
      meta: buildPaginationMeta(paginated),
      filters: {
        status: status ?? null,
        category_id: categoryId,
        search: search ?? null,
        date_from: dateFrom ?? null,
        date_to: dateTo ?? null,
      },
    })
  }

  async show({ params, inertia, response }: HttpContext) {
    const serviceRequest = await Request.query()
      .where('id', params.id)
      .preload('category')
      .preload('user')
      .preload('userVehicle', (vehicleQuery) => {
        vehicleQuery.preload('carBrand').preload('carModel')
      })
      .preload('attachments')
      .preload('responses', (responsesQuery) => {
        responsesQuery
          .orderBy('createdAt', 'asc')
          .preload('businessUser', (businessQuery) => {
            businessQuery.preload('businessProfile')
          })
      })
      .first()

    if (!serviceRequest) {
      return response.redirect('/admin/requests')
    }

    const responses = await Promise.all(
      serviceRequest.responses.map((item) => enrichResponseWithRating(item, true))
    )

    return inertia.render('admin/RequestDetail', {
      request: {
        ...serializeRequest(serviceRequest),
        responses,
      },
    })
  }
}
