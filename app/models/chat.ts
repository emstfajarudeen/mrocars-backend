import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Request from '#models/request'
import User from '#models/user'
import ChatMessage from '#models/chat_message'

export default class Chat extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requestId: number | null

  @column()
  declare userId: number

  @column()
  declare businessUserId: number

  @column.dateTime()
  declare lastMessageAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Request)
  declare request: BelongsTo<typeof Request>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'businessUserId',
  })
  declare businessUser: BelongsTo<typeof User>

  @hasMany(() => ChatMessage)
  declare messages: HasMany<typeof ChatMessage>
}
