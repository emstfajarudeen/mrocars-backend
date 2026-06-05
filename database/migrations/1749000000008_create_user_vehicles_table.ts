import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_vehicles'

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
      table
        .integer('car_brand_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('car_brands')
        .onDelete('CASCADE')
      table
        .integer('car_model_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('car_models')
        .onDelete('CASCADE')
      table.string('year').notNullable()
      table.string('registration_number').nullable()
      table.string('vin_number').nullable()
      table.string('photo').nullable()
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
