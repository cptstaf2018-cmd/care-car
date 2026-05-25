import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function ProtectedRoute({ children, requiredRole, allowedRoles, fallback }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={fallback || (user?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={fallback || (user?.role === 'superadmin' ? '/admin' : '/')} replace />
  }
  return children
}
