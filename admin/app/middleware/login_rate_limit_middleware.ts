import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const attempts: Map<string, { count: number; lockedUntil: number | null }> = new Map()
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

export default class LoginRateLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    const now = Date.now()
    const record = attempts.get(ip)

    if (record?.lockedUntil && now < record.lockedUntil) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000)
      return ctx.response.status(429).json({
        error: `Too many login attempts. Try again in ${remainingMinutes} minute(s).`,
      })
    }

    // Reset if lockout expired
    if (record?.lockedUntil && now >= record.lockedUntil) {
      attempts.delete(ip)
    }

    return next()
  }

  static recordFailure(ip: string): void {
    const record = attempts.get(ip) || { count: 0, lockedUntil: null }
    record.count++
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_MS
    }
    attempts.set(ip, record)
  }

  static recordSuccess(ip: string): void {
    attempts.delete(ip)
  }
}
