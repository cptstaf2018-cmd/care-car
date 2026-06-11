import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, BarChart3, Building2, Car, ChevronLeft, ChevronRight, CreditCard,
  Gauge, LogOut, Package, PlusCircle, Receipt, Settings, ShieldCheck, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { getCenterSettings } from '../api/settings'
import { displayUserContact } from '../utils/displayIdentity'
import { PLAN_RANK } from '../constants/plans'

const centerGroups = [
  {
    title: 'التشغيل',
    links: [
      { to: '/center', label: 'الرئيسية', icon: Gauge },
      { to: '/center/services/new', label: 'خدمة سريعة', icon: PlusCircle },
      { to: '/center/cars', label: 'سيارات الزبائن', icon: Car },
    ],
  },
  {
    title: 'الإدارة',
    links: [
      { to: '/center/invoices', label: 'الفواتير', icon: Receipt },
      { to: '/center/debts', label: 'الديون', icon: CreditCard },
      { to: '/center/inventory', label: 'المخزون', icon: Package },
      { to: '/center/reports', label: 'التقارير', icon: BarChart3 },
      { to: '/center/settings', label: 'إعدادات المركز', icon: Settings },
    ],
  },
]

const adminGroups = [
  {
    title: 'المنصة',
    links: [
      { to: '/admin', label: 'الرئيسية', icon: ShieldCheck },
      { to: '/admin/monitoring', label: 'مراقبة المراكز', icon: Activity },
      { to: '/admin/tenants', label: 'الشركات والمراكز', icon: Building2 },
      { to: '/admin/subscriptions', label: 'الاشتراكات', icon: CreditCard },
    ],
  },
]

function SidebarContent({ collapsed, setCollapsed, onClose }) {
  const { user, logout } = useAuthStore()
  const groups = user?.role === 'superadmin' ? adminGroups : centerGroups
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'sidebar'],
    queryFn: () => getCenterSettings().then(r => r.data),
    enabled: user?.role !== 'superadmin',
  })
  const centerName = center?.name || 'تشغيل المركز'
  const isAdmin = user?.role === 'superadmin'
  const isPartsStore = !isAdmin && center?.specialty === 'multi_service'
  const isOilCenter = !isAdmin && (center?.specialty || 'quick_service') === 'quick_service'
  const visibleGroups = !isAdmin
    ? centerGroups.map(group => ({
        ...group,
        links: group.links
          .filter(link => link.to !== '/center/cars' || isOilCenter)
          .map(link => link.to === '/center/services/new' && isPartsStore ? { ...link, label: 'نقطة بيع' } : link),
      }))
    : groups
  const userContact = displayUserContact(user, center)
  const canUpgrade = !isAdmin && center?.plan && (PLAN_RANK[center.plan] || 1) < PLAN_RANK.enterprise

  return (
    <div className="flex h-full flex-col border-l border-slate-900 bg-[#08111f] text-white">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cyan-400 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">
              {!isAdmin && center?.logo_url ? (
                <img src={center.logo_url} alt="" className="h-full w-full bg-white object-contain p-1" />
              ) : (
                'CC'
              )}
            </div>
            {!collapsed && (
              <div>
                <h2 className="max-w-[170px] truncate font-black text-white">{isAdmin ? 'care-car-saas' : centerName}</h2>
                <p className="mt-1 text-xs text-slate-400">{isAdmin ? 'لوحة السوبر أدمن' : 'ERP خدمات السيارات'}</p>
              </div>
            )}
          </div>
          {setCollapsed ? (
            <button onClick={() => setCollapsed(v => !v)} className="rounded-md border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
              {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <button onClick={onClose} className="rounded-md border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        {visibleGroups.map(group => (
          <div key={group.title}>
            {!collapsed && <p className="mb-2 px-3 text-xs font-bold text-slate-500">{group.title}</p>}
            <div className="space-y-1">
              {group.links.map(link => (
                <NavLink key={link.to} to={link.to} end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }>
                  <link.icon size={19} strokeWidth={2.3} />
                  {!collapsed && <span className="font-bold">{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        {canUpgrade && !collapsed && (
          <NavLink
            to="/center/settings?upgrade=1"
            onClick={onClose}
            className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-3 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
          >
            <Sparkles size={16} />
            ترقية الاشتراك
          </NavLink>
        )}
        {!collapsed && (
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            {user?.role !== 'superadmin' && <p className="mb-1 truncate text-xs font-bold text-cyan-200">{centerName}</p>}
            <p className="truncate text-sm font-bold" dir="ltr">{userContact}</p>
            <p className="mt-1 text-xs text-slate-400">{user?.role === 'superadmin' ? 'مدير المنصة' : 'حساب مركز'}</p>
          </div>
        )}
        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-sm font-bold text-slate-300 transition hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-rose-100">
          <LogOut size={17} />
          {!collapsed && 'تسجيل الخروج'}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Desktop: always visible, collapsible */}
      <motion.aside
        animate={{ width: collapsed ? 88 : 276 }}
        transition={{ duration: 0.22 }}
        className="sticky top-0 hidden h-screen shrink-0 lg:block"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </motion.aside>

      {/* Mobile: slide-in overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed right-0 top-0 z-50 h-full w-72 lg:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
