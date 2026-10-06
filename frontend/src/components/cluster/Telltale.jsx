import { Link } from 'react-router-dom'

/** Oil-pressure lamp as drawn on real dashboards (no stock icon matches it). */
export function OilCanIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10h3l2-2h3l1 2h4l5-3-6 8H5a2 2 0 0 1-2-2z" />
      <path d="M8 8V6M6.5 6h3" />
      <path d="M21 13.5c0 .8-.6 1.5-1.2 1.5s-1.3-.7-1.3-1.5.6-1.8 1.2-2.5c.7.7 1.3 1.7 1.3 2.5z" />
    </svg>
  )
}

const TONES = {
  amber: 'text-oil drop-shadow-[0_0_8px_rgba(240,163,58,0.85)]',
  red: 'text-alert drop-shadow-[0_0_8px_rgba(229,83,61,0.85)]',
}

/**
 * Dashboard warning lamp. Lit when `count` > 0 (or during the ignition self-test);
 * tapping it opens the page that resolves the warning.
 */
export default function Telltale({ icon, label, count, tone = 'amber', to, selfTest }) {
  const lit = selfTest || count > 0
  return (
    <Link
      to={to}
      aria-label={`${label}: ${count || 0}`}
      className="group flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors hover:bg-petrol focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil"
    >
      <span className={`relative transition-[color,filter] duration-300 ${lit ? TONES[tone] : 'text-petrol-soft'}`}>
        {icon}
        {count > 0 && !selfTest && (
          <span className="absolute -end-3 -top-2 min-w-[18px] rounded-full bg-mint px-1 text-center text-[10px] font-bold leading-[18px] text-petrol-deep">
            {count}
          </span>
        )}
      </span>
      <span className={`text-[11px] ${lit && !selfTest ? 'text-mint' : 'text-gauge'}`}>{label}</span>
    </Link>
  )
}
