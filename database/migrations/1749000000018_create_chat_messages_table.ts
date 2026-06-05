import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('chat_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('chats')
        .onDelete('CASCADE')
      table
        .integer('sender_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.text('message').nullable()
      table.string('voice_note').nullable()
      table.string('attachment').nullable()
      table.enum('attachment_type', ['image', 'document']).nullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
