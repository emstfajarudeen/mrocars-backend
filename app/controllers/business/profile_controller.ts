import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import BusinessProfile from '#models/business_profile'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, publicUrl, storeFile, validateImageFile } from '#helpers/upload'
import AuthService from '#services/auth_service'
import {
  bankDetailsValidator,
  businessAddressValidator,
  changePasswordValidator,
  languageValidator,
  updateProfileValidator,
} from '#validators/business/profile_validator'

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

async function getOrCreateBusinessProfile(user: User) {
  let profile = await BusinessProfile.query().where('userId', user.id).first()

  if (!profile) {
    profile = await BusinessProfile.create({
      userId: user.id,
      businessName: user.name,
      email: user.email,
      phoneCode: user.phoneCode ?? '',
      phoneNumber: user.phoneNumber ?? '',
      isApproved: false,
    })
  }

  return profile
}

function mapBusinessAddressPayload(payload: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  if (payload.governorate_id !== undefined) data.governorateId = payload.governorate_id
  if (payload.area_id !== undefined) data.areaId = payload.area_id
  if (payload.block !== undefined) data.block = payload.block
  if (payload.street !== undefined) data.street = payload.street
  if (payload.building_name !== undefined) data.buildingName = payload.building_name
  if (payload.building_no !== undefined) data.buildingNo = payload.building_no
  if (payload.floor_no !== undefined) data.floorNo = payload.floor_no
  if (payload.shop_no !== undefined) data.shopNo = payload.shop_no
  if (payload.latitude !== undefined) data.latitude = String(payload.latitude)
  if (payload.longitude !== undefined) data.longitude = String(payload.longitude)
  return data
}

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      await user.load('businessProfile', (query) => {
        query.preload('governorate').preload('area')
      })

      return ApiResponse.success(response, {
        user: user.serialize(),
        business_profile: user.businessProfile?.serialize() ?? null,
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async update({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const payload = await request.validateUsing(updateProfileValidator)

      if (payload.name !== undefined) user.name = payload.name
      await user.save()

      const profile = await getOrCreateBusinessProfile(user)

      if (payload.business_name !== undefined) profile.businessName = payload.business_name
      if (payload.email !== undefined) profile.email = payload.email
      if (payload.phone_code !== undefined) profile.phoneCode = payload.phone_code
      if (payload.phone_number !== undefined) profile.phoneNumber = payload.phone_number

      const avatar = request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (avatar) {
        const fileErrors = validateImageFile(avatar, 'avatar')
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
        await deleteFileIfExists(profile.avatar)
        const path = await storeFile(avatar, `business/avatars/${user.id}`)
        profile.avatar = path
      }

      await profile.save()
      await profile.load('governorate')
      await profile.load('area')

      const profileData = {
        ...profile.serialize(),
        avatar_url: publicUrl(profile.avatar),
      }

      return ApiResponse.success(
        response,
        {
          user: user.serialize(),
          business_profile: profileData,
          message: 'Profile updated',
        },
        'Profile updated'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async updateAddress({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const payload = await request.validateUsing(businessAddressValidator)
      const profile = await getOrCreateBusinessProfile(user)

      profile.merge(mapBusinessAddressPayload(payload))
      await profile.save()
      await profile.load('governorate')
      await profile.load('area')

      return ApiResponse.success(
        response,
        {
          business_profile: profile.serialize(),
          message: 'Address updated',
        },
        'Address updated'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async updateBankDetails({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail() as User
      const payload = await request.validateUsing(bankDetailsValidator)
      const profile = await getOrCreateBusinessProfile(user)

      profile.bankName = payload.bank_name
      profile.accountName = payload.account_name
      profile.iban = payload.iban
      await profile.save()

      return ApiResponse.success(
        response,
        { message: 'Bank details updated' },
        'Bank details updated'
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
