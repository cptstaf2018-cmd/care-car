import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Cars from './pages/Cars'
import NewService from './pages/NewService'
import Invoices from './pages/Invoices'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import CenterSettings from './pages/CenterSettings'
import InvoicePrint from './pages/InvoicePrint'
import AdminOverview from './pages/superadmin/Overview'
import AdminTenants from './pages/superadmin/Tenants'
import Subscriptions from './pages/superadmin/Subscriptions'
import Activate from './pages/Activate'
import { useAuthStore } from './store/auth'

const qc = new QueryClient()
const centerRoles = ['manager', 'employee']

function HomeRedirect() {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'superadmin' ? '/admin' : '/center'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login initialMode="register" />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/center" element={<ProtectedRoute allowedRoles={centerRoles}><Dashboard /></ProtectedRoute>} />
          <Route path="/center/cars" element={<ProtectedRoute allowedRoles={centerRoles}><Cars /></ProtectedRoute>} />
          <Route path="/center/services/new" element={<ProtectedRoute allowedRoles={centerRoles}><NewService /></ProtectedRoute>} />
          <Route path="/center/invoices" element={<ProtectedRoute allowedRoles={centerRoles}><Invoices /></ProtectedRoute>} />
          <Route path="/center/inventory" element={<ProtectedRoute allowedRoles={centerRoles}><Inventory /></ProtectedRoute>} />
          <Route path="/center/reports" element={<ProtectedRoute allowedRoles={centerRoles}><Reports /></ProtectedRoute>} />
          <Route path="/center/settings" element={<ProtectedRoute allowedRoles={centerRoles}><CenterSettings /></ProtectedRoute>} />
          <Route path="/center/invoices/:id/print" element={<ProtectedRoute allowedRoles={centerRoles}><InvoicePrint /></ProtectedRoute>} />
          <Route path="/cars" element={<Navigate to="/center/cars" replace />} />
          <Route path="/services/new" element={<Navigate to="/center/services/new" replace />} />
          <Route path="/invoices" element={<Navigate to="/center/invoices" replace />} />
          <Route path="/inventory" element={<Navigate to="/center/inventory" replace />} />
          <Route path="/reports" element={<Navigate to="/center/reports" replace />} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="superadmin"><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/tenants" element={<ProtectedRoute requiredRole="superadmin"><AdminTenants /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="superadmin"><Subscriptions /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
