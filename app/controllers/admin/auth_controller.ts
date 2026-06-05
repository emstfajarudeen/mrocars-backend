import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { ApiResponse } from '#helpers/response'
import AuthService from '#services/auth_service'
import { loginValidator } from '#validators/admin/auth_validator'

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

export default class AuthController {
  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)

      const user = await AuthService.findActiveUserByEmail(email, 'admin')
      if (!user || !user.password || !(await hash.verify(user.password, password))) {
        return ApiResponse.error(response, 'Invalid credentials', undefined, 401)
      }

      const tokens = await AuthService.generateTokens(user, auth)
      return ApiResponse.success(
        response,
        { user: user.serialize(), ...tokens },
        'Logged in successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      await AuthService.revokeToken(user.id)
      return ApiResponse.success(
        response,
        { message: 'Logged out successfully' },
        'Logged out successfully'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
