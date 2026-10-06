import { NavLink } from 'react-router-dom'
import { Car, Gauge, Menu, Receipt } from 'lucide-react'
import StartKey from './StartKey'

const TABS_BEFORE = [
  { to: '/center', label: 'الرئيسية', icon: Gauge },
  { to: '/center/cars', label: 'السيارات', icon: Car },
]
const TABS_AFTER = [{ to: '/center/invoices', label: 'الفواتير', icon: Receipt }]

function Tab({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${
          isActive ? 'text-oil' : 'text-gauge-light'
        }`
      }
    >
      <Icon size={21} aria-hidden="true" />
      {label}
    </NavLink>
  )
}

/** Phone navigation: four tabs with the START key raised in the middle, like a car's centre console. */
export default function MobileTabBar({ onMore }) {
  return (
    <nav
      aria-label="التنقل السريع"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-petrol-line bg-petrol-deep pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-end">
        {TABS_BEFORE.map((tab) => <Tab key={tab.to} {...tab} />)}
        <div className="-mt-7 flex w-24 justify-center">
          <StartKey size="sm" />
        </div>
        {TABS_AFTER.map((tab) => <Tab key={tab.to} {...tab} />)}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-bold text-gauge-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
        >
          <Menu size={21} aria-hidden="true" />
          المزيد
        </button>
      </div>
    </nav>
  )
}
