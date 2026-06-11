import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'request_responses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('attachment')
      table.json('attachments').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('attachments')
      table.string('attachment').nullable()
    })
  }
}
