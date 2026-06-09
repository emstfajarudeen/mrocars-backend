import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, publicUrl, storeFile, validateImageFile } from '#helpers/upload'
import AuthService from '#services/auth_service'
import {
  changePasswordValidator,
  languageValidator,
  updateProfileValidator,
} from '#validators/user/profile_validator'

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

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

      if (payload.name !== undefined) user.name = payload.name
      if (payload.phone_code !== undefined) user.phoneCode = payload.phone_code
      if (payload.phone_number !== undefined) user.phoneNumber = payload.phone_number
      if (payload.language !== undefined) user.language = payload.language

      await user.save()

      return ApiResponse.success(
        response,
        { user: user.serialize(), message: 'Profile updated successfully' },
        'Profile updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async updateAvatar({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const avatar = request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      const fileErrors = validateImageFile(avatar, 'avatar')
      if (fileErrors) {
        return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
      }

      await deleteFileIfExists(user.avatar)
      const path = await storeFile(avatar!, `avatars/${user.id}`)
      user.avatar = path
      await user.save()

      return ApiResponse.success(
        response,
        {
          avatar_url: publicUrl(path)!,
          message: 'Avatar updated successfully',
        },
        'Avatar updated successfully'
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

  async updateLanguage({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const { language } = await request.validateUsing(languageValidator)

      user.language = language
      await user.save()

      return ApiResponse.success(
        response,
        { language, message: 'Language updated successfully' },
        'Language updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async deleteAccount({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      await AuthService.revokeToken(user.id)
      await user.delete()

      return ApiResponse.success(
        response,
        { message: 'Account deleted successfully' },
        'Account deleted successfully'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
