import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/auth'
import { useAuthStore } from '../store/auth'

export default function ProtectedRoute({ children, requiredRole, allowedRoles, fallback }) {
  const { token, user } = useAuthStore()
  const { isLoading } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => getMe().then(r => r.data),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  })

  if (!token) return <Navigate to="/login" replace />
  if (isLoading) return null
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={fallback || (user?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={fallback || (user?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  return children
}
