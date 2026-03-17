import { Head, useForm } from '@inertiajs/react'

export default function SetupPage() {
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    email: '',
    password: '',
    full_name: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/setup')
  }

  return (
    <>
      <Head title="Initial Setup" />
      <div className="min-h-screen bg-desert-sand flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-desert-green">The Attic AI</h1>
            <p className="text-desert-stone-dark mt-2">Create your admin account</p>
          </div>

          <div className="bg-desert-white rounded-lg p-8 border border-desert-stone-light shadow-sm">
            <p className="text-sm text-desert-stone-dark mb-6">
              Welcome! Create the initial administrator account to get started.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-desert-stone-dark mb-1">
                  Full Name (optional)
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={data.full_name}
                  onChange={(e) => setData('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-desert-stone-light rounded-md focus:outline-none focus:ring-2 focus:ring-desert-green focus:border-transparent"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-desert-stone-dark mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={data.username}
                  onChange={(e) => setData('username', e.target.value)}
                  className="w-full px-3 py-2 border border-desert-stone-light rounded-md focus:outline-none focus:ring-2 focus:ring-desert-green focus:border-transparent"
                  autoFocus
                  autoComplete="username"
                />
                {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-desert-stone-dark mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full px-3 py-2 border border-desert-stone-light rounded-md focus:outline-none focus:ring-2 focus:ring-desert-green focus:border-transparent"
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-desert-stone-dark mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="w-full px-3 py-2 border border-desert-stone-light rounded-md focus:outline-none focus:ring-2 focus:ring-desert-green focus:border-transparent"
                  autoComplete="new-password"
                />
                <p className="text-xs text-desert-stone-dark mt-1">Minimum 8 characters</p>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 px-4 bg-desert-green text-white font-medium rounded-md hover:bg-desert-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Creating account...' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
