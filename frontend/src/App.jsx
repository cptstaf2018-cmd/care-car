import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import CenterSetupGate from './components/CenterSetupGate'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cars from './pages/Cars'
import NewService from './pages/NewService'
import Invoices from './pages/Invoices'
import Debts from './pages/Debts'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import CenterSettings from './pages/CenterSettings'
import CenterOnboarding from './pages/CenterOnboarding'
import InvoicePrint from './pages/InvoicePrint'
import AdminOverview from './pages/superadmin/Overview'
import AdminMonitoring from './pages/superadmin/Monitoring'
import AdminTenants from './pages/superadmin/Tenants'
import Subscriptions from './pages/superadmin/Subscriptions'
import PlatformAds from './pages/superadmin/PlatformAds'
import Activate from './pages/Activate'
import LandingPage from './pages/LandingPage'
import MobileCamera from './pages/MobileCamera'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Support from './pages/Support'
import AccountDeletion from './pages/AccountDeletion'
import { useAuthStore } from './store/auth'

const qc = new QueryClient()
const centerRoles = ['manager', 'employee']

function CenterPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={centerRoles}>
      <CenterSetupGate>{children}</CenterSetupGate>
    </ProtectedRoute>
  )
}

function HomeRedirect() {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superadmin' ? '/admin' : '/center'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login initialMode="register" />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/about" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />
          <Route path="/mobile-camera/:token" element={<MobileCamera />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/center/onboarding" element={<ProtectedRoute allowedRoles={centerRoles}><CenterSetupGate><CenterOnboarding /></CenterSetupGate></ProtectedRoute>} />
          <Route path="/center" element={<CenterPage><Dashboard /></CenterPage>} />
          <Route path="/center/cars" element={<CenterPage><Cars /></CenterPage>} />
          <Route path="/center/services/new" element={<CenterPage><NewService /></CenterPage>} />
          <Route path="/center/invoices" element={<CenterPage><Invoices /></CenterPage>} />
          <Route path="/center/debts" element={<CenterPage><Debts /></CenterPage>} />
          <Route path="/center/inventory" element={<CenterPage><Inventory /></CenterPage>} />
          <Route path="/center/reports" element={<CenterPage><Reports /></CenterPage>} />
          <Route path="/center/settings" element={<CenterPage><CenterSettings /></CenterPage>} />
          <Route path="/center/reception" element={<Navigate to="/center/services/new" replace />} />
          <Route path="/center/camera" element={<Navigate to="/center/services/new" replace />} />
          <Route path="/center/invoices/:id/print" element={<ProtectedRoute allowedRoles={centerRoles}><InvoicePrint /></ProtectedRoute>} />
          <Route path="/cars" element={<Navigate to="/center/cars" replace />} />
          <Route path="/services/new" element={<Navigate to="/center/services/new" replace />} />
          <Route path="/invoices" element={<Navigate to="/center/invoices" replace />} />
          <Route path="/debts" element={<Navigate to="/center/debts" replace />} />
          <Route path="/inventory" element={<Navigate to="/center/inventory" replace />} />
          <Route path="/reports" element={<Navigate to="/center/reports" replace />} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="superadmin"><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/monitoring" element={<ProtectedRoute requiredRole="superadmin"><AdminMonitoring /></ProtectedRoute>} />
          <Route path="/admin/tenants" element={<ProtectedRoute requiredRole="superadmin"><AdminTenants /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="superadmin"><Subscriptions /></ProtectedRoute>} />
          <Route path="/admin/ads" element={<ProtectedRoute requiredRole="superadmin"><PlatformAds /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
