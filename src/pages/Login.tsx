import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi } from '../api/auth'
import { useAuthStore } from '../store'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function Login() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await loginApi(email, password)
      setAuth(user)
      if (user.role === 'superadmin') {
        navigate('/select-tenant')
      } else if (user.role === 'driver') {
        navigate('/driver')
      } else {
        navigate('/')
      }
    } catch {
      setError('Invalid credentials. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--c-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white"
            style={{ background: 'var(--c-accent)', boxShadow: '0 8px 28px var(--c-accent-glow)' }}
          >
            F
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--c-text)]">FleetOpsX</h1>
            <p className="text-sm text-[var(--c-muted)] mt-1">Sign in to your dispatch console</p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 space-y-5"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatcher@demo.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-[var(--c-red)] bg-[var(--c-red-dim)] border border-[rgba(248,113,113,0.2)] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full h-10 mt-2">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--c-muted)] mt-6">
          FleetOpsX · Dispatch Intelligence Platform
        </p>
      </div>
    </div>
  )
}
