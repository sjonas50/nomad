import AuditLog from '#models/audit_log'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export class AuditService {
  static async log(opts: {
    ctx?: HttpContext
    userId?: number
    username?: string
    action: string
    resourceType?: string
    resourceId?: string
    result: 'success' | 'failure' | 'denied'
    details?: Record<string, unknown>
  }): Promise<void> {
    try {
      const user = opts.ctx?.auth?.user
      await AuditLog.create({
        user_id: opts.userId ?? user?.id ?? null,
        username: opts.username ?? user?.username ?? 'system',
        action: opts.action,
        resource_type: opts.resourceType ?? null,
        resource_id: opts.resourceId ?? null,
        result: opts.result,
        details: opts.details ? JSON.stringify(opts.details) : null,
        ip_address: opts.ctx?.request?.ip() ?? null,
        user_agent: opts.ctx?.request?.header('user-agent')?.substring(0, 500) ?? null,
      })
    } catch (error) {
      logger.error(`Failed to write audit log: ${error.message}`)
    }
  }
}
