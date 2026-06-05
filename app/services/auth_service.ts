import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import type { UserRole } from '#types/user'

export default class AuthService {
  static async generateTokens(user: User, auth: HttpContext['auth']) {
    const result = await auth.use('jwt').generate(user)
    return {
      access_token: result.token,
      refresh_token: result.refreshToken!,
    }
  }

  static async verifyRefreshToken(refreshToken: string, auth: HttpContext['auth']) {
    try {
      const result = await auth.use('jwt').generateWithRefreshToken(refreshToken)
      if (!result) {
        return null
      }
      return { access_token: result.token }
    } catch {
      return null
    }
  }

  static async revokeToken(userId: number) {
    const user = await User.findOrFail(userId)
    await User.refreshTokens.deleteAll(user)
  }

  static async sendOtpEmail(email: string, otp: string) {
    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS'))
        .to(email)
        .subject('Your MROCars OTP Code')
        .html(`Your OTP is: ${otp}. Valid for 15 minutes.`)
    })
  }

  static async findActiveUserByEmail(email: string, role: UserRole) {
    return User.query().where('email', email).where('role', role).where('isActive', true).first()
  }

  static async requestPasswordReset(email: string, role: UserRole) {
    const user = await this.findActiveUserByEmail(email, role)
    if (!user) {
      return { status: 'not_found' as const }
    }

    const recentToken = await PasswordResetToken.query()
      .where('email', email)
      .orderBy('createdAt', 'desc')
      .first()

    if (recentToken && recentToken.createdAt > DateTime.now().minus({ minutes: 1 })) {
      return { status: 'rate_limited' as const }
    }

    await PasswordResetToken.query().where('email', email).delete()

    const otp = String(randomInt(100000, 999999))
    await PasswordResetToken.create({
      email,
      token: otp,
      expiresAt: DateTime.now().plus({ minutes: 15 }),
    })

    await this.sendOtpEmail(email, otp)
    return { status: 'sent' as const }
  }

  static async verifyOtp(email: string, otp: string) {
    return PasswordResetToken.query()
      .where('email', email)
      .where('token', otp)
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()
  }

  static async resetPassword(email: string, token: string, password: string, role: UserRole) {
    const resetToken = await PasswordResetToken.query()
      .where('email', email)
      .where('token', token)
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()

    if (!resetToken) {
      return null
    }

    const user = await this.findActiveUserByEmail(email, role)
    if (!user) {
      return null
    }

    user.password = await hash.make(password)
    await user.save()
    await resetToken.delete()

    return user
  }
}
