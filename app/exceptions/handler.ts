import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'
import type { ApiErrorResponse } from '#helpers/response'

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code
    return typeof code === 'string' ? code : undefined
  }

  return undefined
}

function isValidationError(
  error: unknown
): error is { messages: Record<string, string[] | string>; status?: number } {
  return getErrorCode(error) === 'E_VALIDATION_ERROR'
}

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  protected renderStatusPages = app.inProduction

  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }

  private isApiRequest(ctx: HttpContext): boolean {
    return ctx.request.url().startsWith('/api/')
  }

  private formatValidationErrors(
    messages: Record<string, string[] | string> | unknown
  ): Record<string, string[]> {
    if (!messages || typeof messages !== 'object') {
      return {}
    }

    return Object.entries(messages as Record<string, string[] | string>).reduce<
      Record<string, string[]>
    >((result, [field, value]) => {
      result[field] = Array.isArray(value) ? value : [value]
      return result
    }, {})
  }

  private respondWithApiError(
    ctx: HttpContext,
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>
  ) {
    const payload: ApiErrorResponse = {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    }

    return ctx.response.status(statusCode).json(payload)
  }

  async handle(error: unknown, ctx: HttpContext) {
    if (!this.isApiRequest(ctx)) {
      return super.handle(error, ctx)
    }

    const errorCode = getErrorCode(error)

    if (isValidationError(error)) {
      return this.respondWithApiError(
        ctx,
        'Validation failed',
        error.status || 422,
        this.formatValidationErrors(error.messages)
      )
    }

    if (errorCode === 'E_UNAUTHORIZED_ACCESS') {
      const message = error instanceof Error ? error.message : 'Unauthorized access'
      return this.respondWithApiError(ctx, message || 'Unauthorized access', 401)
    }

    if (errorCode === 'E_ROUTE_NOT_FOUND') {
      return this.respondWithApiError(ctx, 'Resource not found', 404)
    }

    if (error instanceof Exception) {
      if (error.status === 404) {
        return this.respondWithApiError(ctx, error.message || 'Resource not found', 404)
      }

      if (error.status === 403) {
        return this.respondWithApiError(ctx, error.message || 'Forbidden access', 403)
      }

      if (error.status === 401) {
        return this.respondWithApiError(ctx, error.message || 'Unauthorized access', 401)
      }
    }

    // Always log unhandled errors to terminal regardless of debug mode
    logger.error({ err: error, url: ctx.request.url(), method: ctx.request.method() }, 'Unhandled exception')

    if (this.debug && error instanceof Error) {
      return this.respondWithApiError(ctx, error.message, 500)
    }

    return this.respondWithApiError(ctx, 'Internal server error', 500)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
