import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import FloatingAssistant from './FloatingAssistant'
import { useAuthStore } from '../store/auth'
import { getCenterSettings } from '../api/settings'
import { displayUserContact } from '../utils/displayIdentity'

export default function Layout({ children, hideHeader = false, compact = false }) {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'layout'],
    queryFn: () => getCenterSettings().then(r => r.data),
    enabled: user?.role !== 'superadmin',
  })
  const pageTitle = user?.role === 'superadmin' ? 'لوحة السوبر أدمن' : 'لوحة المركز'
  const userContact = displayUserContact(user, center)

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-auto">
        {!hideHeader && (
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/92 backdrop-blur">
            <div className="flex items-center justify-between px-5 py-3 lg:px-7">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">care-car-saas</p>
                  <h1 className="text-base font-black text-slate-950 lg:text-lg">
                    {pageTitle}
                  </h1>
                </div>
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900" dir="ltr">{userContact}</p>
                <p className="text-xs text-slate-500">{user?.role === 'superadmin' ? 'إدارة المنصة والمشتركين' : 'تشغيل المركز والزبائن'}</p>
              </div>
            </div>
          </header>
        )}
        {hideHeader && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 top-4 z-20 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-lg hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        <div className={`px-4 lg:px-7 ${compact ? 'py-3 lg:py-4' : 'py-5 lg:py-6'}`}>{children}</div>
      </main>
      {user?.role !== 'superadmin' && <FloatingAssistant center={center} />}
    </div>
  )
}
