import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'business_profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('business_name').notNullable()
      table.string('email').notNullable()
      table.string('phone_code').notNullable()
      table.string('phone_number').notNullable()
      table.string('avatar').nullable()
      table
        .integer('governorate_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('governorates')
        .onDelete('RESTRICT')
      table
        .integer('area_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('areas')
        .onDelete('RESTRICT')
      table.string('block').nullable()
      table.string('street').nullable()
      table.string('building_name').nullable()
      table.string('building_no').nullable()
      table.string('floor_no').nullable()
      table.string('shop_no').nullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.string('bank_name').nullable()
      table.string('account_name').nullable()
      table.string('iban').nullable()
      table.boolean('is_approved').notNullable().defaultTo(false)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
