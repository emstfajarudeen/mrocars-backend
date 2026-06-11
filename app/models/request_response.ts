import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { OfferValidityType, ResponseStatus } from '#types/request_response'
import Request from '#models/request'
import User from '#models/user'

export default class RequestResponse extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare responseNo: string

  @column()
  declare requestId: number

  @column()
  declare businessUserId: number

  @column()
  declare notes: string | null

  @column()
  declare price: string

  @column()
  declare offerValidityType: OfferValidityType

  @column.date()
  declare offerValidUntil: DateTime | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      try { return JSON.parse(value) } catch { return [] }
    },
  })
  declare attachments: string[]

  @column()
  declare status: ResponseStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Request)
  declare request: BelongsTo<typeof Request>

  @belongsTo(() => User, {
    foreignKey: 'businessUserId',
  })
  declare businessUser: BelongsTo<typeof User>
}
