import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: 'nomad-session',
  clearWithBrowser: false,
  age: '8h',
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
  store: 'cookie',
  stores: {
    cookie: stores.cookie(),
  },
})

export default sessionConfig
