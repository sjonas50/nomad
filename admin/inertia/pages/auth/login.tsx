import { Head, useForm } from '@inertiajs/react'

export default function LoginPage() {
  const { data, setData, post, processing, errors } = useForm({
    uid: '',
    password: '',
    remember_me: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/login')
  }

  return (
    <>
      <Head title="Login" />
      <div className="min-h-screen bg-desert-sand flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-desert-green">The Attic AI</h1>
            <p className="text-desert-stone-dark mt-2">Sign in to continue</p>
          </div>

          <div className="bg-desert-white rounded-lg p-8 border border-desert-stone-light shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="uid" className="block text-sm font-medium text-desert-stone-dark mb-1">
                  Username or Email
                </label>
                <input
                  id="uid"
                  type="text"
                  value={data.uid}
                  onChange={(e) => setData('uid', e.target.value)}
                  className="w-full px-3 py-2 border border-desert-stone-light rounded-md focus:outline-none focus:ring-2 focus:ring-desert-green focus:border-transparent"
                  autoFocus
                  autoComplete="username"
                />
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
                  autoComplete="current-password"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.remember_me}
                  onChange={(e) => setData('remember_me', e.target.checked)}
                  className="w-4 h-4 rounded border-desert-stone-light text-desert-green focus:ring-desert-green"
                />
                <span className="text-sm text-desert-stone-dark">Remember me</span>
              </label>

              {errors.uid && (
                <p className="text-sm text-red-600">{errors.uid}</p>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-2.5 px-4 bg-desert-green text-white font-medium rounded-md hover:bg-desert-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
