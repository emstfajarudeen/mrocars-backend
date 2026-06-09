import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import { ApiResponse } from '#helpers/response'
import { isValidationError } from '#helpers/masters'
import {
  changePasswordValidator,
  updateProfileValidator,
} from '#validators/admin/profile_validator'

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      return ApiResponse.success(response, { user: user.serialize() })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async update({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const payload = await request.validateUsing(updateProfileValidator)

      if (payload.name !== undefined) {
        user.name = payload.name
      }

      await user.save()

      return ApiResponse.success(
        response,
        { user: user.serialize(), message: 'Profile updated' },
        'Profile updated'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async changePassword({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const payload = await request.validateUsing(changePasswordValidator)

      if (!user.password || !(await hash.verify(user.password, payload.old_password))) {
        return ApiResponse.error(response, 'Invalid password', undefined, 401)
      }

      user.password = payload.new_password
      await user.save()

      return ApiResponse.success(
        response,
        { message: 'Password changed successfully' },
        'Password changed successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }
}
