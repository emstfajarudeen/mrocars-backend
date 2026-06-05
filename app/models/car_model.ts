import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CarBrand from '#models/car_brand'

export default class CarModel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare carBrandId: number

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => CarBrand)
  declare carBrand: BelongsTo<typeof CarBrand>
}
