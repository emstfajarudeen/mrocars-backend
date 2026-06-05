import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'areas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('governorate_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('governorates')
        .onDelete('RESTRICT')
      table.string('name_en').notNullable()
      table.string('name_ar').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
