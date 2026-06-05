import type { HttpContext } from '@adonisjs/core/http'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, storeFile, validateImageFile } from '#helpers/upload'
import { createVehicleValidator, updateVehicleValidator } from '#validators/user/vehicle_validator'

function isValidationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'E_VALIDATION_ERROR'
  )
}

async function findOwnedVehicle(userId: number, id: number) {
  return UserVehicle.query().where('id', id).where('userId', userId).first()
}

async function promoteNextDefault(userId: number) {
  const next = await UserVehicle.query().where('userId', userId).first()
  if (next) {
    next.isDefault = true
    await next.save()
  }
}

export default class VehicleController {
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicles = await UserVehicle.query()
        .where('userId', user.id)
        .preload('carBrand')
        .preload('carModel')

      return ApiResponse.success(response, {
        vehicles: vehicles.map((vehicle) => vehicle.serialize()),
      })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createVehicleValidator)

      const existingCount = await UserVehicle.query().where('userId', user.id).count('* as total')
      const isFirst = Number(existingCount[0].$extras.total) === 0

      let photoPath: string | null = null
      const photo = request.file('photo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const photoErrors = validateImageFile(photo, 'photo', false)
      if (photoErrors) {
        return ApiResponse.error(response, 'Validation failed', photoErrors, 422)
      }
      if (photo) {
        photoPath = await storeFile(photo, `vehicles/${user.id}`)
      }

      const vehicle = await UserVehicle.create({
        userId: user.id,
        carBrandId: payload.car_brand_id,
        carModelId: payload.car_model_id,
        year: payload.year,
        registrationNumber: payload.registration_number ?? null,
        vinNumber: payload.vin_number ?? null,
        photo: photoPath,
        isDefault: isFirst,
      })

      await vehicle.load('carBrand')
      await vehicle.load('carModel')

      return ApiResponse.success(
        response,
        { vehicle: vehicle.serialize(), message: 'Vehicle added successfully' },
        'Vehicle added successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await UserVehicle.query()
        .where('id', params.id)
        .where('userId', user.id)
        .preload('carBrand')
        .preload('carModel')
        .first()

      if (!vehicle) {
        return ApiResponse.error(response, 'Vehicle not found', undefined, 404)
      }

      return ApiResponse.success(response, { vehicle: vehicle.serialize() })
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async update({ auth, request, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await findOwnedVehicle(user.id, Number(params.id))

      if (!vehicle) {
        return ApiResponse.error(response, 'Vehicle not found', undefined, 404)
      }

      const payload = await request.validateUsing(updateVehicleValidator)

      if (payload.car_brand_id !== undefined) vehicle.carBrandId = payload.car_brand_id
      if (payload.car_model_id !== undefined) vehicle.carModelId = payload.car_model_id
      if (payload.year !== undefined) vehicle.year = payload.year
      if (payload.registration_number !== undefined) {
        vehicle.registrationNumber = payload.registration_number
      }
      if (payload.vin_number !== undefined) vehicle.vinNumber = payload.vin_number

      const photo = request.file('photo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      const photoErrors = validateImageFile(photo, 'photo', false)
      if (photoErrors) {
        return ApiResponse.error(response, 'Validation failed', photoErrors, 422)
      }
      if (photo) {
        await deleteFileIfExists(vehicle.photo)
        vehicle.photo = await storeFile(photo, `vehicles/${user.id}`)
      }

      await vehicle.save()
      await vehicle.load('carBrand')
      await vehicle.load('carModel')

      return ApiResponse.success(
        response,
        { vehicle: vehicle.serialize(), message: 'Vehicle updated successfully' },
        'Vehicle updated successfully'
      )
    } catch (error) {
      if (isValidationError(error)) throw error
      return ApiResponse.error(response, 'Something went wrong', undefined, 500)
    }
  }

  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await findOwnedVehicle(user.id, Number(params.id))

      if (!vehicle) {
        return ApiResponse.error(response, 'Vehicle not found', undefined, 404)
      }

      const wasDefault = vehicle.isDefault
      await deleteFileIfExists(vehicle.photo)
      await vehicle.delete()

      if (wasDefault) {
        await promoteNextDefault(user.id)
      }

      return ApiResponse.success(
        response,
        { message: 'Vehicle removed successfully' },
        'Vehicle removed successfully'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }

  async setDefault({ auth, params, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const vehicle = await findOwnedVehicle(user.id, Number(params.id))

      if (!vehicle) {
        return ApiResponse.error(response, 'Vehicle not found', undefined, 404)
      }

      await UserVehicle.query().where('userId', user.id).update({ isDefault: false })
      vehicle.isDefault = true
      await vehicle.save()

      return ApiResponse.success(
        response,
        { message: 'Default vehicle updated' },
        'Default vehicle updated'
      )
    } catch {
      return ApiResponse.error(response, 'Unauthorized', undefined, 401)
    }
  }
}
