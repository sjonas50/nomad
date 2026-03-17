import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (requestOrigin) => {
    // Allow configurable origin via env var, default to same-origin
    const allowedOrigin = env.get('CORS_ORIGIN', '')
    if (allowedOrigin === '*') return true
    if (allowedOrigin) return requestOrigin === allowedOrigin
    // Default: allow same-origin (the app's own URL)
    const appUrl = env.get('URL', '')
    if (appUrl) {
      try {
        return requestOrigin === new URL(appUrl).origin
      } catch {
        return false
      }
    }
    return false
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
