import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { RequestStatus, WhenNeeded } from '#types/request'
import User from '#models/user'
import UserVehicle from '#models/user_vehicle'
import Category from '#models/category'
import RequestResponse from '#models/request_response'
import RequestAttachment from '#models/request_attachment'

export default class Request extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requestNo: string

  @column()
  declare userId: number

  @column()
  declare userVehicleId: number | null

  @column()
  declare categoryId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare voiceNote: string | null

  @column()
  declare sparePartType: string | null

  @column()
  declare noOfTyres: number | null

  @column()
  declare whenNeeded: WhenNeeded | null

  @column.date()
  declare scheduledDate: DateTime | null

  @column()
  declare scheduledTime: string | null

  @column()
  declare pickupLocationName: string | null

  @column()
  declare pickupLatitude: string | null

  @column()
  declare pickupLongitude: string | null

  @column()
  declare deliveryLocationName: string | null

  @column()
  declare deliveryLatitude: string | null

  @column()
  declare deliveryLongitude: string | null

  @column()
  declare status: RequestStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => UserVehicle)
  declare userVehicle: BelongsTo<typeof UserVehicle>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => RequestResponse)
  declare responses: HasMany<typeof RequestResponse>

  @hasMany(() => RequestAttachment)
  declare attachments: HasMany<typeof RequestAttachment>
}
