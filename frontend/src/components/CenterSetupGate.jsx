import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCenterSettings } from '../api/settings'

export default function CenterSetupGate({ children }) {
  const location = useLocation()
  const { data, isLoading } = useQuery({
    queryKey: ['center-settings', 'setup-gate'],
    queryFn: () => getCenterSettings().then(r => r.data),
    retry: false,
  })

  if (isLoading) return null
  if (data && data.specialty_configured === false && location.pathname !== '/center/onboarding') {
    return <Navigate to="/center/onboarding" replace />
  }
  if (data && data.specialty_configured !== false && location.pathname === '/center/onboarding') {
    return <Navigate to="/center" replace />
  }
  return children
}
