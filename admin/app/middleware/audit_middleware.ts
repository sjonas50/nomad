import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { AuditService } from '#services/audit_service'

export default class AuditMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const method = ctx.request.method()

    // Only audit state-changing requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next()
    }

    const startTime = Date.now()
    try {
      const result = await next()
      await AuditService.log({
        ctx,
        action: `${method} ${ctx.route?.pattern || ctx.request.url()}`,
        result: 'success',
        details: {
          duration_ms: Date.now() - startTime,
          status: ctx.response.getStatus(),
        },
      })
      return result
    } catch (error) {
      await AuditService.log({
        ctx,
        action: `${method} ${ctx.route?.pattern || ctx.request.url()}`,
        result: 'failure',
        details: {
          duration_ms: Date.now() - startTime,
          error: error.message,
        },
      })
      throw error
    }
  }
}
