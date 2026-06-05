import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Governorate from '#models/governorate'

export default class Area extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare governorateId: number

  @column()
  declare nameEn: string

  @column()
  declare nameAr: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Governorate)
  declare governorate: BelongsTo<typeof Governorate>
}
