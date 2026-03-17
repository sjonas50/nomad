import { BaseModel, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AuditLog extends BaseModel {
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number | null

  @column()
  declare username: string | null

  @column()
  declare action: string

  @column()
  declare resource_type: string | null

  @column()
  declare resource_id: string | null

  @column()
  declare result: 'success' | 'failure' | 'denied'

  @column()
  declare details: string | null

  @column()
  declare ip_address: string | null

  @column()
  declare user_agent: string | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime
}
