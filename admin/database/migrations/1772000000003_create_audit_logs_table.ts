import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users')
      table.string('username', 100).nullable()
      table.string('action', 100).notNullable()
      table.string('resource_type', 100).nullable()
      table.string('resource_id', 255).nullable()
      table.enum('result', ['success', 'failure', 'denied']).notNullable()
      table.text('details').nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
