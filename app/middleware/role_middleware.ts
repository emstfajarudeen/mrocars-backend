import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { UserRole } from '#types/user'
import User from '#models/user'

export interface RoleMiddlewareOptions {
  role: UserRole | UserRole[]
}

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: RoleMiddlewareOptions) {
    const user = ctx.auth.user

    if (!user) {
      throw new Exception('Unauthorized access', { status: 401, code: 'E_UNAUTHORIZED_ACCESS' })
    }

    const allowedRoles = Array.isArray(options.role) ? options.role : [options.role]
    const authenticatedUser = user as User

    if (!allowedRoles.includes(authenticatedUser.role)) {
      throw new Exception('Forbidden access', { status: 403, code: 'E_FORBIDDEN_ACCESS' })
    }

    return next()
  }
}
