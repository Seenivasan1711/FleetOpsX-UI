import { Navigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

interface Props {
  children: React.ReactNode
  role?: 'dispatcher' | 'driver'
}

export default function ProtectedRoute({ children, role }: Props) {
  const user = useAppStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/'} replace />
  }
  return <>{children}</>
}
