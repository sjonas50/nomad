import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('username', 100).unique().notNullable()
      table.string('email', 255).unique().notNullable()
      table.string('password', 255).notNullable()
      table.string('full_name', 255).nullable()
      table.enum('role', ['admin', 'operator', 'viewer']).notNullable().defaultTo('viewer')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('last_login_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
