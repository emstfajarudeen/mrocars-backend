import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('label').notNullable()
      table
        .integer('governorate_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('governorates')
        .onDelete('RESTRICT')
      table
        .integer('area_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('areas')
        .onDelete('RESTRICT')
      table.string('block').notNullable()
      table.string('street').notNullable()
      table.enum('property_type', ['house', 'building']).notNullable()
      table.string('house_no').nullable()
      table.string('building_name').nullable()
      table.string('building_no').nullable()
      table.string('floor_no').nullable()
      table.string('door_no').nullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
