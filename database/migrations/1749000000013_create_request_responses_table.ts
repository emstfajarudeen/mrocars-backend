import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'request_responses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('response_no').notNullable().unique()
      table
        .integer('request_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('requests')
        .onDelete('CASCADE')
      table
        .integer('business_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.text('notes').nullable()
      table.decimal('price', 10, 3).notNullable()
      table.enum('offer_validity_type', ['date', 'open']).notNullable().defaultTo('open')
      table.date('offer_valid_until').nullable()
      table.string('attachment').nullable()
      table.enum('status', ['pending', 'accepted', 'rejected']).notNullable().defaultTo('pending')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
