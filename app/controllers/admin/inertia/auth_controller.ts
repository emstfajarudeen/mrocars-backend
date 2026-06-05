import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { isValidationError } from '#helpers/masters'
import { loginValidator } from '#validators/admin/auth_validator'

export default class AuthController {
  async showLogin({ auth, inertia, response }: HttpContext) {
    await auth.use('web').check()
    const user = auth.use('web').user

    if (user?.role === 'admin') {
      return response.redirect('/admin/dashboard')
    }

    return inertia.render('admin/Login')
  }

  async login({ request, auth, response, session }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)
      const user = await User.verifyCredentials(email, password)

      if (user.role !== 'admin' || !user.isActive) {
        session.flash('error', 'Invalid credentials')
        return response.redirect().back()
      }

      await auth.use('web').login(user)
      return response.redirect('/admin/dashboard')
    } catch (error) {
      if (isValidationError(error)) throw error
      session.flash('error', 'Invalid credentials')
      return response.redirect().back()
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/admin/login')
  }
}
