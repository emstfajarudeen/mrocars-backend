import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone_code').nullable()
      table.string('phone_number').nullable()
      table.string('password').notNullable()
      table.string('avatar').nullable()
      table.enum('role', ['admin', 'business', 'user']).notNullable().defaultTo('user')
      table.enum('language', ['en', 'ar']).notNullable().defaultTo('en')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('email_verified_at').nullable()
      table.string('remember_me_token').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
