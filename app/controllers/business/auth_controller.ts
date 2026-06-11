import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { ApiResponse } from '#helpers/response'
import { serializeBusinessProfile } from '#helpers/request_helper'
import AuthService from '#services/auth_service'
import {
  loginValidator,
  forgotPasswordValidator,
  verifyOtpValidator,
  resetPasswordValidator,
  refreshTokenValidator,
} from '#validators/business/auth_validator'

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

      const user = await AuthService.findActiveUserByEmail(email, 'business')
      if (!user || !user.password || !(await hash.verify(user.password, password))) {
        return ApiResponse.error(response, 'Invalid credentials', undefined, 401)
      }

      await user.load('businessProfile', (query) => {
        query.preload('governorate').preload('area')
      })
      const tokens = await AuthService.generateTokens(user, auth)

      return ApiResponse.success(
        response,
        {
          user: user.serialize(),
          business_profile: user.businessProfile
            ? serializeBusinessProfile(user.businessProfile, user.language)
            : null,
          ...tokens,
        },
        'Logged in successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(forgotPasswordValidator)

      const result = await AuthService.requestPasswordReset(email, 'business')
      if (result.status === 'not_found') {
        return ApiResponse.error(response, 'User not found', undefined, 404)
      }
      if (result.status === 'rate_limited') {
        return ApiResponse.error(
          response,
          'Too many attempts. Please try again later.',
          undefined,
          429
        )
      }

      return ApiResponse.success(
        response,
        { message: 'OTP sent to your email' },
        'OTP sent to your email'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async verifyOtp({ request, response }: HttpContext) {
    try {
      const { email, otp } = await request.validateUsing(verifyOtpValidator)

      const token = await AuthService.verifyOtp(email, otp)
      if (!token) {
        return ApiResponse.error(response, 'Invalid or expired OTP', undefined, 401)
      }

      return ApiResponse.success(
        response,
        { message: 'OTP verified', reset_token: token.token },
        'OTP verified'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async resetPassword({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(resetPasswordValidator)

      const user = await AuthService.resetPassword(
        payload.email,
        payload.token,
        payload.password,
        'business'
      )
      if (!user) {
        return ApiResponse.error(response, 'Invalid or expired token', undefined, 401)
      }

      return ApiResponse.success(
        response,
        { message: 'Password reset successful' },
        'Password reset successful'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async refreshToken({ request, response, auth }: HttpContext) {
    try {
      const { refresh_token: refreshToken } = await request.validateUsing(refreshTokenValidator)

      const result = await AuthService.verifyRefreshToken(refreshToken, auth)
      if (!result) {
        return ApiResponse.error(response, 'Invalid refresh token', undefined, 401)
      }

      return ApiResponse.success(response, { access_token: result.access_token }, 'Token refreshed')
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
