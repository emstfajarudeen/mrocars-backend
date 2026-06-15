import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enquiries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('app_type').notNullable().defaultTo('user') // 'user' or 'business'
      table.string('name').nullable()
      table.string('email').nullable()
      table.string('subject').notNullable()
      table.text('message').notNullable()
      table.string('status').notNullable().defaultTo('pending') // 'pending' or 'resolved'
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}