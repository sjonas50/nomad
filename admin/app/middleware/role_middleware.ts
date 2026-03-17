import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
}

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: string[] }) {
    const user = ctx.auth.user!
    const userLevel = ROLE_HIERARCHY[user.role] || 0
    const requiredLevel = Math.min(...options.roles.map((r) => ROLE_HIERARCHY[r] || 999))

    if (userLevel < requiredLevel) {
      return ctx.response.status(403).json({
        error: 'Insufficient permissions',
      })
    }

    return next()
  }
}
