import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('order_no').notNullable().unique()
      table
        .integer('request_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('requests')
        .onDelete('RESTRICT')
      table
        .integer('request_response_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('request_responses')
        .onDelete('RESTRICT')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('business_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.decimal('parts_price', 10, 3).notNullable()
      table.decimal('delivery_fee', 10, 3).notNullable().defaultTo(0)
      table.decimal('platform_fee', 10, 3).notNullable().defaultTo(0)
      table.decimal('total_amount', 10, 3).notNullable()
      table.enum('payment_method', ['knet', 'credit_card', 'apple_pay']).nullable()
      table.enum('payment_status', ['unpaid', 'paid']).notNullable().defaultTo('unpaid')
      table
        .integer('delivery_address_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('user_addresses')
        .onDelete('SET NULL')
      table
        .enum('status', ['new', 'pending', 'delivered', 'cancelled'])
        .notNullable()
        .defaultTo('new')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
