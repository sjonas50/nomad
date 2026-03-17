import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import StaticMiddleware from '@adonisjs/static/static_middleware'
import { AssetsConfig } from '@adonisjs/static/types'

/**
 * See #providers/map_static_provider.ts for explanation
 * of why this middleware exists.
 *
 * Only serves map files if the request has an authenticated session.
 * The auth check inspects the session cookie before serving any static content.
 */
export default class MapsStaticMiddleware {
  constructor(
    private path: string,
    private config: AssetsConfig
  ) {}

  async handle(ctx: HttpContext, next: NextFn) {
    // Only serve map files for requests that target /storage/maps paths
    // and have an authenticated session
    const url = ctx.request.url()
    if (url.startsWith('/storage/maps')) {
      try {
        await ctx.auth.use('web').authenticate()
      } catch {
        return ctx.response.status(401).send('Unauthorized')
      }
    }

    const staticMiddleware = new StaticMiddleware(this.path, this.config)
    return staticMiddleware.handle(ctx, next)
  }
}
