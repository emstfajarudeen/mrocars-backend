import type { HttpContext } from '@adonisjs/core/http'
import Enquiry from '#models/enquiry'
import { ApiResponse } from '#helpers/response'
import { createEnquiryValidator } from '#validators/user/enquiry_validator'

export default class EnquiryController {
  async storeUser({ auth, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createEnquiryValidator)
      const isAuthenticated = await auth.use('jwt').check()
      const user = isAuthenticated ? auth.use('jwt').user : null

      const enquiry = await Enquiry.create({
        userId: user?.id ?? null,
        appType: 'user',
        name: payload.name ?? user?.name ?? null,
        email: payload.email ?? user?.email ?? null,
        subject: payload.subject,
        message: payload.message,
        status: 'pending',
      })

      return ApiResponse.success(response, { enquiry: enquiry.serialize(), message: 'Message sent successfully' }, 'Message sent successfully', 201)
    } catch (error) {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async storeBusiness({ auth, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createEnquiryValidator)
      const isAuthenticated = await auth.use('jwt').check()
      const user = isAuthenticated ? auth.use('jwt').user : null

      const enquiry = await Enquiry.create({
        userId: user?.id ?? null,
        appType: 'business',
        name: payload.name ?? user?.name ?? null,
        email: payload.email ?? user?.email ?? null,
        subject: payload.subject,
        message: payload.message,
        status: 'pending',
      })

      return ApiResponse.success(response, { enquiry: enquiry.serialize(), message: 'Message sent successfully' }, 'Message sent successfully', 201)
    } catch (error) {
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
