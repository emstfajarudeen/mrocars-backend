import type { HttpContext } from '@adonisjs/core/http'
import UserAddress from '#models/user_address'
import { ApiResponse } from '#helpers/response'
import { createAddressValidator, updateAddressValidator } from '#validators/user/address_validator'

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

async function findOwnedAddress(userId: number, id: number) {
  return UserAddress.query().where('id', id).where('userId', userId).first()
}

async function promoteNextDefault(userId: number) {
  const next = await UserAddress.query().where('userId', userId).first()
  if (next) {
    next.isDefault = true
    await next.save()
  }
}

function mapAddressPayload(payload: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  if (payload.label !== undefined) data.label = payload.label
  if (payload.governorate_id !== undefined) data.governorateId = payload.governorate_id
  if (payload.area_id !== undefined) data.areaId = payload.area_id
  if (payload.block !== undefined) data.block = payload.block
  if (payload.street !== undefined) data.street = payload.street
  if (payload.property_type !== undefined) data.propertyType = payload.property_type
  if (payload.house_no !== undefined) data.houseNo = payload.house_no
  if (payload.building_name !== undefined) data.buildingName = payload.building_name
  if (payload.building_no !== undefined) data.buildingNo = payload.building_no
  if (payload.floor_no !== undefined) data.floorNo = payload.floor_no
  if (payload.door_no !== undefined) data.doorNo = payload.door_no
  if (payload.latitude !== undefined) data.latitude = String(payload.latitude)
  if (payload.longitude !== undefined) data.longitude = String(payload.longitude)
  return data
}

export default class AddressController {
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const addresses = await UserAddress.query()
        .where('userId', user.id)
        .preload('governorate')
        .preload('area')

      return ApiResponse.success(response, {
        addresses: addresses.map((address) => address.serialize()),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createAddressValidator)

      const existingCount = await UserAddress.query().where('userId', user.id).count('* as total')
      const isFirst = Number(existingCount[0].$extras.total) === 0

      const address = await UserAddress.create({
        userId: user.id,
        label: payload.label,
        governorateId: payload.governorate_id,
        areaId: payload.area_id,
        block: payload.block,
        street: payload.street,
        propertyType: payload.property_type,
        houseNo: payload.house_no ?? null,
        buildingName: payload.building_name ?? null,
        buildingNo: payload.building_no ?? null,
        floorNo: payload.floor_no ?? null,
        doorNo: payload.door_no ?? null,
        latitude: payload.latitude !== undefined ? String(payload.latitude) : null,
        longitude: payload.longitude !== undefined ? String(payload.longitude) : null,
        isDefault: isFirst,
      })

      await address.load('governorate')
      await address.load('area')

      return ApiResponse.success(
        response,
        { address: address.serialize(), message: 'Address added successfully' },
        'Address added successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const address = await UserAddress.query()
        .where('id', params.id)
        .where('userId', user.id)
        .preload('governorate')
        .preload('area')
        .first()

      if (!address) {
        return ApiResponse.error(response, 'Address not found', undefined, 404)
      }

      return ApiResponse.success(response, { address: address.serialize() })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async update({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const address = await findOwnedAddress(user.id, Number(params.id))

      if (!address) {
        return ApiResponse.error(response, 'Address not found', undefined, 404)
      }

      const payload = await request.validateUsing(updateAddressValidator)
      address.merge(mapAddressPayload(payload))
      await address.save()
      await address.load('governorate')
      await address.load('area')

      return ApiResponse.success(
        response,
        { address: address.serialize(), message: 'Address updated successfully' },
        'Address updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const address = await findOwnedAddress(user.id, Number(params.id))

      if (!address) {
        return ApiResponse.error(response, 'Address not found', undefined, 404)
      }

      const wasDefault = address.isDefault
      await address.delete()

      if (wasDefault) {
        await promoteNextDefault(user.id)
      }

      return ApiResponse.success(
        response,
        { message: 'Address removed successfully' },
        'Address removed successfully'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async setDefault({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const address = await findOwnedAddress(user.id, Number(params.id))

      if (!address) {
        return ApiResponse.error(response, 'Address not found', undefined, 404)
      }

      await UserAddress.query().where('userId', user.id).update({ isDefault: false })
      address.isDefault = true
      await address.save()

      return ApiResponse.success(
        response,
        { message: 'Default address updated' },
        'Default address updated'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
