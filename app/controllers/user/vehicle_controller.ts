import type { HttpContext } from '@adonisjs/core/http'
import UserVehicle from '#models/user_vehicle'
import { ApiResponse } from '#helpers/response'
import { deleteFileIfExists, storeFile, validateImageFile } from '#helpers/upload'
import { createVehicleValidator, updateVehicleValidator } from '#validators/user/vehicle_validator'
import { serializeUserVehicle } from '#helpers/request_helper'

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
        vehicles: vehicles.map((vehicle) => serializeUserVehicle(vehicle)),
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

      const uploadedPaths: string[] = []

      // Handle multiple photos
      const photos = request.files('photos', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (photos && photos.length > 0) {
        for (const file of photos) {
          const fileErrors = validateImageFile(file, 'photos', false)
          if (fileErrors) {
            return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
          }
        }
        for (const file of photos) {
          const path = await storeFile(file, `vehicles/${user.id}`)
          uploadedPaths.push(path)
        }
      }

      // Handle single photo (backward compatibility)
      const photo = request.file('photo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (photo) {
        const fileErrors = validateImageFile(photo, 'photo', false)
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
        const path = await storeFile(photo, `vehicles/${user.id}`)
        uploadedPaths.push(path)
      }

      const vehicle = await UserVehicle.create({
        userId: user.id,
        carBrandId: payload.car_brand_id,
        carModelId: payload.car_model_id,
        year: payload.year,
        registrationNumber: payload.registration_number ?? null,
        vinNumber: payload.vin_number ?? null,
        photos: uploadedPaths.length > 0 ? uploadedPaths : null,
        isDefault: isFirst,
      })

      await vehicle.load('carBrand')
      await vehicle.load('carModel')

      return ApiResponse.success(
        response,
        { vehicle: serializeUserVehicle(vehicle), message: 'Vehicle added successfully' },
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

      return ApiResponse.success(response, { vehicle: serializeUserVehicle(vehicle) })
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

      const newPaths: string[] = []

      // Handle multiple photos
      const photos = request.files('photos', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (photos && photos.length > 0) {
        for (const file of photos) {
          const fileErrors = validateImageFile(file, 'photos', false)
          if (fileErrors) {
            return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
          }
        }
        if (vehicle.photos) {
          for (const oldPhoto of vehicle.photos) {
            await deleteFileIfExists(oldPhoto)
          }
        }
        for (const file of photos) {
          const path = await storeFile(file, `vehicles/${user.id}`)
          newPaths.push(path)
        }
        vehicle.photos = newPaths
      }

      // Handle single photo (backward compatibility)
      const photo = request.file('photo', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (photo) {
        const fileErrors = validateImageFile(photo, 'photo', false)
        if (fileErrors) {
          return ApiResponse.error(response, 'Validation failed', fileErrors, 422)
        }
        if (vehicle.photos) {
          for (const oldPhoto of vehicle.photos) {
            await deleteFileIfExists(oldPhoto)
          }
        }
        const path = await storeFile(photo, `vehicles/${user.id}`)
        vehicle.photos = [path]
      }

      await vehicle.save()
      await vehicle.load('carBrand')
      await vehicle.load('carModel')

      return ApiResponse.success(
        response,
        { vehicle: serializeUserVehicle(vehicle), message: 'Vehicle updated successfully' },
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
      if (vehicle.photos) {
        for (const oldPhoto of vehicle.photos) {
          await deleteFileIfExists(oldPhoto)
        }
      }
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
