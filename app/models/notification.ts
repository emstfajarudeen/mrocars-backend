import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  declare type: string

  @column({
    prepare: (value: Record<string, unknown> | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: string | Record<string, unknown> | null) => {
      if (!value) return null
      if (typeof value === 'string') return JSON.parse(value) as Record<string, unknown>
      return value
    },
  })
  declare data: Record<string, unknown> | null

  @column()
  declare isRead: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
