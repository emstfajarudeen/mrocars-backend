import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_vehicles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('photo', 'photos')
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.text('photos').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('photos', 255).nullable().alter()
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('photos', 'photo')
    })
  }
}