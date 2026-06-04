import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getMe } from '../api/auth'
import { useAuthStore } from '../store/auth'

export default function ProtectedRoute({ children, requiredRole, allowedRoles, fallback }) {
  const { token, user, setUser } = useAuthStore()
  const { data: freshUser, isLoading } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => getMe().then(r => r.data),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  })
  const currentUser = freshUser || user

  useEffect(() => {
    if (freshUser) setUser(freshUser)
  }, [freshUser, setUser])

  if (!token) return <Navigate to="/login" replace />
  if (isLoading) return null
  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to={fallback || (currentUser?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to={fallback || (currentUser?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  return children
}
