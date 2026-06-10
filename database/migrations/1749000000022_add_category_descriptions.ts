import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('description_en').nullable().after('name_ar')
      table.text('description_ar').nullable().after('description_en')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description_en')
      table.dropColumn('description_ar')
    })
  }
}
