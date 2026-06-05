import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '#types/order'
import Request from '#models/request'
import RequestResponse from '#models/request_response'
import User from '#models/user'
import UserAddress from '#models/user_address'
import OrderAdditionalWork from '#models/order_additional_work'
import OrderRating from '#models/order_rating'

export default class Order extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderNo: string

  @column()
  declare requestId: number | null

  @column()
  declare requestResponseId: number | null

  @column()
  declare userId: number

  @column()
  declare businessUserId: number

  @column()
  declare partsPrice: string

  @column()
  declare deliveryFee: string

  @column()
  declare platformFee: string

  @column()
  declare totalAmount: string

  @column()
  declare paymentMethod: PaymentMethod | null

  @column()
  declare paymentStatus: PaymentStatus

  @column()
  declare deliveryAddressId: number | null

  @column()
  declare status: OrderStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Request)
  declare request: BelongsTo<typeof Request>

  @belongsTo(() => RequestResponse)
  declare requestResponse: BelongsTo<typeof RequestResponse>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'businessUserId',
  })
  declare businessUser: BelongsTo<typeof User>

  @belongsTo(() => UserAddress, {
    foreignKey: 'deliveryAddressId',
  })
  declare deliveryAddress: BelongsTo<typeof UserAddress>

  @hasMany(() => OrderAdditionalWork)
  declare additionalWorks: HasMany<typeof OrderAdditionalWork>

  @hasOne(() => OrderRating)
  declare rating: HasOne<typeof OrderRating>
}
