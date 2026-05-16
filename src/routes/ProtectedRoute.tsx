import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store'

type Props = {
  children: ReactNode
  role?:    'dispatcher' | 'driver' | 'superadmin'
}

export default function ProtectedRoute({ children, role }: Props) {
  const user = useAuthStore((s) => s.user)

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role && user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/'} replace />
  }

  return <>{children}</>
}
