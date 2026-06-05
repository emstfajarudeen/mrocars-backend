import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminWebAuthMiddleware {
  redirectTo = '/admin/login'

  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.authenticateUsing(['web'], { loginRoute: this.redirectTo })
    return next()
  }
}
