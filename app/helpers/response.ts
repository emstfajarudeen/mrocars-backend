import type { Response } from '@adonisjs/core/http'

export interface ApiSuccessResponse<T = unknown> {
  success: true
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export class ApiResponse {
  static success<T>(
    response: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ) {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
    }

    return response.status(statusCode).json(payload)
  }

  static error(
    response: Response,
    message: string,
    errors?: Record<string, string[]>,
    statusCode = 400
  ) {
    const payload: ApiErrorResponse = {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    }

    return response.status(statusCode).json(payload)
  }
}
