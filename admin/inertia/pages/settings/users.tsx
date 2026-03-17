import { Head } from '@inertiajs/react'
import { useState } from 'react'
import SettingsLayout from '~/layouts/SettingsLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import StyledButton from '~/components/StyledButton'
import Alert from '~/components/Alert'
import useAuth from '~/hooks/useAuth'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: 'admin' | 'operator' | 'viewer'
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

const api = axios.create({ baseURL: '/api' })

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer',
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.users
    },
  })

  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/users', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateForm(false)
      setFormData({ username: '', email: '', password: '', full_name: '', role: 'viewer' })
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message)
    },
  })

  const updateUser = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; role?: string; is_active?: boolean }) => {
      const res = await api.patch(`/users/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message)
    },
  })

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    operator: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  }

  return (
    <SettingsLayout>
      <Head title="User Management" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-desert-green mb-2">User Management</h1>
              <p className="text-desert-stone-dark">Manage user accounts and permissions</p>
            </div>
            <StyledButton onClick={() => setShowCreateForm(!showCreateForm)} icon="IconUserPlus">
              Add User
            </StyledButton>
          </div>

          {error && (
            <Alert
              type="error"
              title="Error"
              message={error}
              variant="bordered"
              dismissible
              onDismiss={() => setError(null)}
            />
          )}

          {showCreateForm && (
            <div className="bg-desert-white rounded-lg p-6 border border-desert-stone-light shadow-sm mb-8">
              <h3 className="font-semibold text-desert-green mb-4">Create New User</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createUser.mutate(formData)
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="px-3 py-2 border border-desert-stone-light rounded-md"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-desert-stone-light rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name (optional)"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="px-3 py-2 border border-desert-stone-light rounded-md"
                />
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="px-3 py-2 border border-desert-stone-light rounded-md"
                  required
                />
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as typeof formData.role })
                  }
                  className="px-3 py-2 border border-desert-stone-light rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-2">
                  <StyledButton disabled={createUser.isPending}>
                    {createUser.isPending ? 'Creating...' : 'Create'}
                  </StyledButton>
                  <StyledButton variant="secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </StyledButton>
                </div>
              </form>
            </div>
          )}

          <div className="bg-desert-white rounded-lg border border-desert-stone-light shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-desert-stone-lighter/50">
                <tr>
                  <th className="text-left p-3 font-medium text-desert-stone-dark">User</th>
                  <th className="text-left p-3 font-medium text-desert-stone-dark">Email</th>
                  <th className="text-left p-3 font-medium text-desert-stone-dark">Role</th>
                  <th className="text-left p-3 font-medium text-desert-stone-dark">Status</th>
                  <th className="text-left p-3 font-medium text-desert-stone-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-desert-stone-lighter">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-desert-stone-lighter/30">
                    <td className="p-3">
                      <div className="font-medium">{user.username}</div>
                      {user.full_name && (
                        <div className="text-xs text-desert-stone-dark">{user.full_name}</div>
                      )}
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUser.mutate({ id: user.id, role: e.target.value })
                        }
                        disabled={user.id === currentUser?.id}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 ${roleColors[user.role]}`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="operator">Operator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() =>
                            updateUser.mutate({ id: user.id, is_active: !user.is_active })
                          }
                          className="text-xs text-desert-green hover:underline"
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </SettingsLayout>
  )
}
