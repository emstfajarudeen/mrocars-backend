import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('request_no').notNullable().unique()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('user_vehicle_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('user_vehicles')
        .onDelete('SET NULL')
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('voice_note').nullable()
      table.string('spare_part_type').nullable()
      table.integer('no_of_tyres').nullable()
      table.enum('when_needed', ['now', 'later']).nullable()
      table.date('scheduled_date').nullable()
      table.time('scheduled_time').nullable()
      table.string('pickup_location_name').nullable()
      table.decimal('pickup_latitude', 10, 8).nullable()
      table.decimal('pickup_longitude', 11, 8).nullable()
      table.string('delivery_location_name').nullable()
      table.decimal('delivery_latitude', 10, 8).nullable()
      table.decimal('delivery_longitude', 11, 8).nullable()
      table
        .enum('status', ['new', 'accepted', 'confirmed', 'rejected', 'cancelled'])
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
