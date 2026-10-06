import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, BarChart3, Building2, Car, ChevronLeft, ChevronRight, CreditCard,
  Gauge, LogOut, Megaphone, Package, Receipt, Settings, ShieldCheck, Sparkles,
} from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { getCenterSettings } from '../api/settings'
import { getInvoices } from '../api/invoices'
import { getInventory } from '../api/inventory'
import { getMaintenanceDue } from '../api/reports'
import { PLAN_RANK } from '../constants/plans'
import { CCBadge } from './BrandMark'
import StartKey from './shell/StartKey'
import TankGauge from './shell/TankGauge'
import { tankFor } from './shell/tank'

const OIL_WARNING_DAYS = 5
const MAINTENANCE_FETCH_LIMIT = 50

const centerGroups = [
  {
    title: 'التشغيل',
    links: [
      { to: '/center', label: 'الرئيسية', icon: Gauge },
      { to: '/center/cars', label: 'سيارات الزبائن', icon: Car, badge: 'oilDue' },
    ],
  },
  {
    title: 'الإدارة',
    links: [
      { to: '/center/invoices', label: 'الفواتير', icon: Receipt },
      { to: '/center/debts', label: 'الديون', icon: CreditCard, badge: 'debts', tone: 'alert' },
      { to: '/center/inventory', label: 'المخزون', icon: Package, badge: 'lowStock' },
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
      { to: '/admin/ads', label: 'إعلانات المنصة', icon: Megaphone },
    ],
  },
]

/** Live counts that light the warning lamps next to menu items (shares query keys with the dashboard). */
function useWarningCounts(enabled, isOilCenter) {
  const invoices = useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices().then((r) => r.data), enabled })
  const inventory = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory().then((r) => r.data), enabled })
  const due = useQuery({
    queryKey: ['maintenance-due'],
    queryFn: () => getMaintenanceDue(MAINTENANCE_FETCH_LIMIT).then((r) => r.data),
    enabled: enabled && isOilCenter,
  })
  return {
    debts: (invoices.data || []).filter((inv) => inv.status !== 'paid').length,
    lowStock: (inventory.data || []).filter((item) => item.low_stock).length,
    oilDue: (due.data?.cars || []).filter((car) => car.days_left <= OIL_WARNING_DAYS).length,
  }
}

function NavItem({ link, count, collapsed, onClick }) {
  return (
    <NavLink
      to={link.to}
      end
      onClick={onClick}
      title={collapsed ? link.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
          isActive ? 'bg-petrol text-mint' : 'text-gauge-light hover:bg-petrol/60 hover:text-mint'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`absolute inset-y-2 end-0 w-1 rounded-full transition-all ${isActive ? 'bg-oil shadow-[0_0_10px_2px_rgba(240,163,58,0.7)]' : 'bg-transparent'}`}
          />
          <link.icon size={19} strokeWidth={2.2} className={isActive ? 'text-oil' : ''} aria-hidden="true" />
          {!collapsed && <span className="font-bold">{link.label}</span>}
          {count > 0 && (
            <span
              className={`${collapsed ? 'absolute end-1 top-1' : 'ms-auto'} grid min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-bold leading-5 ${
                link.tone === 'alert' ? 'bg-alert text-white shadow-[0_0_10px_rgba(229,83,61,0.6)]' : 'bg-oil text-petrol-deep'
              }`}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ collapsed, setCollapsed, onClose, showStart = true }) {
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'superadmin'
  const groups = isAdmin ? adminGroups : centerGroups
  const { data: center } = useQuery({
    queryKey: ['center-settings', 'sidebar'],
    queryFn: () => getCenterSettings().then((r) => r.data),
    enabled: !isAdmin,
  })
  const counts = useWarningCounts(!isAdmin, (center?.specialty || 'quick_service') === 'quick_service')
  const centerName = center?.name || 'تشغيل المركز'
  const tank = isAdmin ? null : tankFor(center)
  const canUpgrade = !isAdmin && center?.plan && (PLAN_RANK[center.plan] || 1) < PLAN_RANK.enterprise
  const ToggleIcon = collapsed ? ChevronLeft : ChevronRight

  return (
    <div className="flex h-full min-h-0 flex-col bg-petrol-deep text-mint">
      <div className="flex items-center justify-between gap-3 border-b border-petrol-line/60 p-3">
        <div className="flex min-w-0 items-center gap-3">
          {!isAdmin && center?.logo_url ? (
            <img src={center.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-[28%] bg-white object-contain p-1" />
          ) : (
            <CCBadge size={40} />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="truncate font-bold">{isAdmin ? 'كير كار' : centerName}</h2>
              <p className="text-xs text-gauge">{isAdmin ? 'لوحة مدير المنصة' : 'لوحة القيادة'}</p>
            </div>
          )}
        </div>
        <button
          onClick={setCollapsed ? () => setCollapsed((v) => !v) : onClose}
          aria-label={collapsed ? 'وسّع القائمة' : 'صغّر القائمة'}
          className="rounded-lg border border-petrol-line p-1.5 text-gauge-light hover:bg-petrol focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
        >
          <ToggleIcon size={16} />
        </button>
      </div>

      {!isAdmin && showStart && (
        <div className="grid place-items-center border-b border-petrol-line/60 py-3">
          <StartKey size={collapsed ? 'sm' : 'md'} onClick={onClose} />
        </div>
      )}

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 [scrollbar-color:#1D5A5E_transparent] [scrollbar-width:thin]" aria-label="الأقسام">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && <p className="mb-2 px-3 text-xs font-bold text-gauge">{group.title}</p>}
            <div className="space-y-1">
              {group.links.map((link) => (
                <NavItem key={link.to} link={link} count={link.badge ? counts[link.badge] : 0} collapsed={collapsed} onClick={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-petrol-line/60 p-3">
        {tank && !collapsed && <TankGauge {...tank} />}
        {canUpgrade && !collapsed && (
          <NavLink
            to="/center/settings?upgrade=1"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-full bg-oil px-3 py-2 text-sm font-bold text-petrol-deep transition hover:bg-oil-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            <Sparkles size={16} aria-hidden="true" />
            عبّي الخزان: ترقية الاشتراك
          </NavLink>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-petrol-line py-2 text-sm font-bold text-gauge-light transition hover:border-alert/60 hover:bg-alert/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
        >
          <LogOut size={17} aria-hidden="true" />
          {!collapsed && 'إطفاء المحرك (خروج)'}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 88 : 288 }}
        transition={{ duration: 0.22 }}
        className="sticky top-0 hidden h-screen shrink-0 border-l border-petrol-line/40 lg:block"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </motion.aside>

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
              <SidebarContent onClose={onClose} showStart={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
