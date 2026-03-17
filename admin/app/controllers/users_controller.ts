import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUserValidator, updateUserValidator, resetPasswordValidator } from '#validators/user'

export default class UsersController {
  async index({}: HttpContext) {
    const users = await User.query().orderBy('created_at', 'asc')
    return { users }
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createUserValidator)

    // Check for existing username/email
    const existing = await User.query()
      .where('username', data.username)
      .orWhere('email', data.email)
      .first()

    if (existing) {
      return response.status(409).json({
        error:
          existing.username === data.username ? 'Username already taken' : 'Email already in use',
      })
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      full_name: data.full_name || null,
      role: data.role,
      is_active: true,
    })

    return response.status(201).json({ user })
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    const data = await request.validateUsing(updateUserValidator)

    // Prevent admin from demoting themselves
    if (user.id === auth.user!.id && data.role && data.role !== 'admin') {
      return response.status(400).json({ error: 'Cannot change your own role' })
    }

    // Prevent admin from deactivating themselves
    if (user.id === auth.user!.id && data.is_active === false) {
      return response.status(400).json({ error: 'Cannot deactivate your own account' })
    }

    if (data.full_name !== undefined) user.full_name = data.full_name || null
    if (data.role !== undefined) user.role = data.role
    if (data.is_active !== undefined) user.is_active = data.is_active

    await user.save()
    return { user }
  }

  async resetPassword({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.status(404).json({ error: 'User not found' })
    }

    const data = await request.validateUsing(resetPasswordValidator)
    user.password = data.password
    await user.save()

    return { success: true }
  }
}
