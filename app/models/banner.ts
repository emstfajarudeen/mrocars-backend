import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Banner extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare titleEn: string

  @column()
  declare titleAr: string

  @column()
  declare descriptionEn: string | null

  @column()
  declare descriptionAr: string | null

  @column()
  declare image: string

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
