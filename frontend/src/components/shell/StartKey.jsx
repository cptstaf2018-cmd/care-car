import { NavLink } from 'react-router-dom'
import { Power } from 'lucide-react'
import '../launch/launch.css'

const SIZES = {
  sm: { box: 60, icon: 18, label: false },
  md: { box: 84, icon: 22, label: true },
}

/** Small push-to-start key that opens a new service; the same key as the dashboard, scaled for chrome. */
export default function StartKey({ size = 'md', onClick, className = '' }) {
  const { box, icon, label } = SIZES[size]
  return (
    <NavLink
      to="/center/services/new"
      onClick={onClick}
      aria-label="خدمة جديدة"
      className={({ isActive }) =>
        `group flex flex-col items-center gap-1.5 focus-visible:outline-none ${className} ${isActive ? 'is-active' : ''}`
      }
    >
      <span
        style={{ width: box, height: box }}
        className="relative grid place-items-center rounded-full p-[5px] shadow-[0_12px_24px_-10px_rgba(0,0,0,0.8)] group-focus-visible:ring-4 group-focus-visible:ring-oil/60"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #9aa7a6, #3d4f50, #d3dddc, #2a3b3c, #9aa7a6)' }} />
        <span aria-hidden="true" className="start-ring-idle absolute inset-[5px] rounded-full bg-[radial-gradient(circle_at_50%_30%,#134549,#061819)] shadow-[0_0_0_2px_#F0A33A] transition-transform group-active:scale-95" />
        <Power size={icon} className="relative text-oil" aria-hidden="true" />
      </span>
      {label && <span className="text-xs font-bold text-mint">خدمة جديدة</span>}
    </NavLink>
  )
}
