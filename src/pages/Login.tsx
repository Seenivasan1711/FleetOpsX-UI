import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi } from '../api/auth'
import useAppStore from '../store/useAppStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAppStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await loginApi(email, password, tenantId)
      setAuth(user)
      navigate(user.role === 'driver' ? '/driver' : '/')
    } catch {
      setError('Invalid credentials. Check your email, password, and Tenant ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FleetOpsX</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your fleet</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="dispatcher@demo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tenant ID</label>
              <Input value={tenantId} onChange={e => setTenantId(e.target.value)} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              <p className="text-xs text-gray-400 mt-1">Found in your welcome email or from the seed script output</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
