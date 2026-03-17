import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, setupValidator } from '#validators/auth'
import LoginRateLimitMiddleware from '#middleware/login_rate_limit_middleware'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AuthController {
  async loginPage({ inertia, auth, request, response }: HttpContext) {
    // If already authenticated, redirect
    if (await auth.check()) {
      if (request.header('x-inertia')) {
        return inertia.location('/home')
      }
      return response.redirect('/home')
    }

    // If no users exist, redirect to setup
    const userCount = await User.query().count('* as total')
    if (Number(userCount[0].$extras.total) === 0) {
      if (request.header('x-inertia')) {
        return inertia.location('/setup')
      }
      return response.redirect('/setup')
    }

    return inertia.render('auth/login')
  }

  async login({ request, auth, response }: HttpContext) {
    const { uid, password, remember_me } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(uid, password)

      if (!user.is_active) {
        LoginRateLimitMiddleware.recordFailure(request.ip())
        return response
          .status(403)
          .json({ error: 'Account is disabled. Contact an administrator.' })
      }

      await auth.use('web').login(user, remember_me || false)

      user.last_login_at = DateTime.now()
      await user.save()

      LoginRateLimitMiddleware.recordSuccess(request.ip())

      return response.redirect('/home')
    } catch {
      LoginRateLimitMiddleware.recordFailure(request.ip())
      return response.status(400).json({ error: 'Invalid credentials' })
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }

  async setupPage({ inertia, request, response }: HttpContext) {
    // Only allow setup if no users exist
    const userCount = await User.query().count('* as total')
    if (Number(userCount[0].$extras.total) > 0) {
      if (request.header('x-inertia')) {
        return inertia.location('/login')
      }
      return response.redirect('/login')
    }

    return inertia.render('auth/setup')
  }

  async setup({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(setupValidator)

    // Use a transaction with a serializable check to prevent race conditions
    const user = await db.transaction(async (trx) => {
      const userCount = await User.query({ client: trx }).count('* as total')
      if (Number(userCount[0].$extras.total) > 0) {
        return null
      }

      return await User.create(
        {
          username: data.username,
          email: data.email,
          password: data.password,
          full_name: data.full_name || null,
          role: 'admin',
          is_active: true,
        },
        { client: trx }
      )
    })

    if (!user) {
      return response.status(403).json({ error: 'Setup already completed' })
    }

    await auth.use('web').login(user)

    return response.redirect('/home')
  }
}
