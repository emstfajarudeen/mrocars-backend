import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { PropertyType } from '#types/address'
import User from '#models/user'
import Governorate from '#models/governorate'
import Area from '#models/area'

export default class UserAddress extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare label: string

  @column()
  declare governorateId: number

  @column()
  declare areaId: number

  @column()
  declare block: string

  @column()
  declare street: string

  @column()
  declare propertyType: PropertyType

  @column()
  declare houseNo: string | null

  @column()
  declare buildingName: string | null

  @column()
  declare buildingNo: string | null

  @column()
  declare floorNo: string | null

  @column()
  declare doorNo: string | null

  @column()
  declare latitude: string | null

  @column()
  declare longitude: string | null

  @column()
  declare isDefault: boolean

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
