import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const centerLinks = [
  { to: '/', label: 'الرئيسية', icon: '🏠' },
  { to: '/cars', label: 'السيارات', icon: '🚗' },
  { to: '/services/new', label: 'خدمة جديدة', icon: '🔧' },
  { to: '/invoices', label: 'الفواتير', icon: '🧾' },
  { to: '/inventory', label: 'المخزون', icon: '📦' },
  { to: '/reports', label: 'التقارير', icon: '📊' },
]

const adminLinks = [
  { to: '/admin', label: 'لوحة الإدارة', icon: '👑' },
  { to: '/admin/tenants', label: 'المراكز', icon: '🏢' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const links = user?.role === 'superadmin' ? adminLinks : centerLinks

  return (
    <aside className="w-60 min-h-screen bg-slate-800 flex flex-col border-l border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl mb-1">🛢️</div>
        <h2 className="font-bold text-white text-base">نظام الزيت</h2>
        <p className="text-slate-400 text-xs mt-1 truncate">{user?.email}</p>
        <span className="inline-block mt-2 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{user?.role}</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'
              }`
            }>
            <span>{l.icon}</span>{l.label}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="m-4 py-2 text-slate-500 hover:text-red-400 text-sm transition-colors text-center">
        تسجيل الخروج
      </button>
    </aside>
  )
}
