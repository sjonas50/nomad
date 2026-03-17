import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

export default class AuditController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = Math.min(request.input('limit', 50), 100)
    const action = request.input('action')
    const username = request.input('username')
    const result = request.input('result')

    const query = AuditLog.query().orderBy('created_at', 'desc')

    if (action) {
      // Escape SQL LIKE wildcards in user input to prevent pattern-based enumeration
      const sanitizedAction = action
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query.whereRaw('action LIKE ? ESCAPE ?', [`%${sanitizedAction}%`, '\\'])
    }
    if (username) query.where('username', username)
    if (result) query.where('result', result)

    const logs = await query.paginate(page, limit)
    return logs
  }
}
