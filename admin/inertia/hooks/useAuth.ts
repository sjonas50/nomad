import { usePage } from '@inertiajs/react'

interface AuthUser {
  id: number
  username: string
  fullName: string | null
  role: 'admin' | 'operator' | 'viewer'
}

interface AuthProps {
  auth: {
    user: AuthUser | null
  }
}

export default function useAuth() {
  const { auth } = usePage<AuthProps>().props
  return {
    user: auth?.user ?? null,
    isAdmin: auth?.user?.role === 'admin',
    isOperator: ['admin', 'operator'].includes(auth?.user?.role || ''),
    isViewer: !!auth?.user,
  }
}
