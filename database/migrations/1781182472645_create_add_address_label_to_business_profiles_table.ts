import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'business_profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('address_label').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('address_label')
    })
  }
}