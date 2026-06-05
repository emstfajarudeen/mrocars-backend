import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Area from '#models/area'

export default class Governorate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

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

  @hasMany(() => Area)
  declare areas: HasMany<typeof Area>
}
