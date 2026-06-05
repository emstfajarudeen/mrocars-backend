import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Governorate from '#models/governorate'
import Area from '#models/area'

export default class BusinessProfile extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare businessName: string

  @column()
  declare email: string

  @column()
  declare phoneCode: string

  @column()
  declare phoneNumber: string

  @column()
  declare avatar: string | null

  @column()
  declare governorateId: number | null

  @column()
  declare areaId: number | null

  @column()
  declare block: string | null

  @column()
  declare street: string | null

  @column()
  declare buildingName: string | null

  @column()
  declare buildingNo: string | null

  @column()
  declare floorNo: string | null

  @column()
  declare shopNo: string | null

  @column()
  declare latitude: string | null

  @column()
  declare longitude: string | null

  @column()
  declare bankName: string | null

  @column()
  declare accountName: string | null

  @column({ serializeAs: null })
  declare iban: string | null

  @column()
  declare isApproved: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Governorate)
  declare governorate: BelongsTo<typeof Governorate>

  @belongsTo(() => Area)
  declare area: BelongsTo<typeof Area>
}
