import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { AdditionalWorkStatus, PaymentStatus } from '#types/order'
import Order from '#models/order'

export default class OrderAdditionalWork extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare notes: string | null

  @column()
  declare voiceNote: string | null

  @column()
  declare price: string

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
  declare status: AdditionalWorkStatus

  @column()
  declare paymentStatus: PaymentStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
