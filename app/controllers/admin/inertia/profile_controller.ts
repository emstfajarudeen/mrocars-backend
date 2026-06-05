import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class ProfileController {
  async show({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail() as User

    return inertia.render('admin/Profile', {
      user: user.serialize(),
    })
  }
}
