import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import CarBrand from '#models/car_brand'
import CarModel from '#models/car_model'

export default class UserVehicle extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare carBrandId: number

  @column()
  declare carModelId: number

  @column()
  declare year: string

  @column()
  declare registrationNumber: string | null

  @column()
  declare vinNumber: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null | string[]) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return [value]
      }
    },
  })
  declare photos: string[] | null

  @column()
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => CarBrand)
  declare carBrand: BelongsTo<typeof CarBrand>

  @belongsTo(() => CarModel)
  declare carModel: BelongsTo<typeof CarModel>
}
