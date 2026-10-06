import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import FloatingAssistant from './FloatingAssistant'
import MobileTabBar from './shell/MobileTabBar'
import { useAuthStore } from '../store/auth'
import { getCenterSettings } from '../api/settings'
import { displayUserContact } from '../utils/displayIdentity'

const PAGE_TITLES = {
  '/center': 'الرئيسية',
  '/center/services/new': 'خدمة جديدة',
  '/center/cars': 'سيارات الزبائن',
  '/center/invoices': 'الفواتير',
  '/center/debts': 'الديون',
  '/center/inventory': 'المخزون',
  '/center/reports': 'التقارير',
  '/center/settings': 'إعدادات المركز',
  '/admin': 'لوحة المنصة',
  '/admin/monitoring': 'مراقبة المراكز',
  '/admin/tenants': 'الشركات والمراكز',
  '/admin/subscriptions': 'الاشتراكات',
  '/admin/ads': 'إعلانات المنصة',
}

export default function Layout({ children, hideHeader = false, compact = false }) {
  const { user } = useAuthStore()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdmin = user?.role === 'superadmin'
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'layout'],
    queryFn: () => getCenterSettings().then((r) => r.data),
    enabled: !isAdmin,
  })
  const title = PAGE_TITLES[pathname] || ''
  const userContact = displayUserContact(user, center)

  return (
    <div className="flex min-h-screen bg-[#EEF4F2]">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-24 lg:pb-0">
        {!hideHeader && (
          <header className="sticky top-0 z-10 border-b border-mint-dim bg-[#EEF4F2]/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-7">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    aria-label="القائمة"
                    className="rounded-xl border border-mint-dim bg-white p-2 text-petrol hover:bg-mint lg:hidden"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <span aria-hidden="true" className="h-8 w-1.5 rounded-full bg-oil shadow-[0_0_12px_2px_rgba(240,163,58,0.45)]" />
                <div>
                  <h1 className="text-lg font-bold leading-tight text-petrol-deep lg:text-xl">{title || 'كير كار'}</h1>
                  <p className="text-xs text-mint-ink">{isAdmin ? 'إدارة المنصة والمشتركين' : center?.name || 'تشغيل المركز'}</p>
                </div>
              </div>
              <p className="hidden truncate text-sm font-bold text-petrol sm:block" dir="ltr">{userContact}</p>
            </div>
          </header>
        )}
        {hideHeader && isAdmin && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="القائمة"
            className="fixed right-4 top-4 z-20 rounded-xl border border-mint-dim bg-white p-2 text-petrol shadow-lg hover:bg-mint lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        <div className={`px-4 lg:px-7 ${compact ? 'py-3 lg:py-4' : 'py-5 lg:py-6'}`}>{children}</div>
      </main>
      {!isAdmin && <MobileTabBar onMore={() => setSidebarOpen(true)} />}
      {!isAdmin && <FloatingAssistant center={center} />}
    </div>
  )
}
