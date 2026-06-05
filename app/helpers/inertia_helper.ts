import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export function inertiaAdminUser(ctx: HttpContext) {
  const user = ctx.auth.user as User | undefined
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export function inertiaFlash(ctx: HttpContext) {
  return {
    success: ctx.session.flashMessages.get('success') as string | undefined,
    error: ctx.session.flashMessages.get('error') as string | undefined,
  }
}
