import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { UserLanguage, UserRole } from '#types/user'
import BusinessProfile from '#models/business_profile'
import UserVehicle from '#models/user_vehicle'
import UserAddress from '#models/user_address'
import Notification from '#models/notification'
import Request from '#models/request'
import RequestResponse from '#models/request_response'
import Order from '#models/order'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phoneCode: string | null

  @column()
  declare phoneNumber: string | null

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare avatar: string | null

  @column()
  declare role: UserRole

  @column()
  declare language: UserLanguage

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column({ serializeAs: null })
  declare rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasOne(() => BusinessProfile)
  declare businessProfile: HasOne<typeof BusinessProfile>

  @hasMany(() => UserVehicle)
  declare vehicles: HasMany<typeof UserVehicle>

  @hasMany(() => UserAddress)
  declare addresses: HasMany<typeof UserAddress>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>

  @hasMany(() => Request)
  declare requests: HasMany<typeof Request>

  @hasMany(() => RequestResponse, {
    foreignKey: 'businessUserId',
  })
  declare businessRequestResponses: HasMany<typeof RequestResponse>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  @hasMany(() => Order, {
    foreignKey: 'businessUserId',
  })
  declare businessOrders: HasMany<typeof Order>

  static refreshTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '7 days',
    prefix: 'rt_',
    table: 'jwt_refresh_tokens',
    type: 'jwt_refresh_token',
    tokenSecretLength: 40,
  })
}
