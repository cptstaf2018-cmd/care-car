import { Link } from 'react-router-dom'

/** The "CC" badge used on invoices, the sidebar and the favicon, in the odometer palette. */
export function CCBadge({ size = 40 }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="inline-grid shrink-0 place-items-center rounded-[28%] bg-oil font-black tracking-tighter text-petrol-deep shadow-[0_6px_16px_-6px_rgba(240,163,58,0.8)]"
    >
      <span dir="ltr">CC</span>
    </span>
  )
}

export default function BrandMark({ light = true, to = '/about', size = 40 }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oil ${light ? 'text-mint' : 'text-petrol-deep'}`}>
      <CCBadge size={size} />
      <span className="leading-tight">
        <b className="block text-lg font-bold">كير كار</b>
        <span dir="ltr" className={`block text-[11px] font-medium tracking-wide ${light ? 'text-gauge-light' : 'text-mint-ink'}`}>Care Car</span>
      </span>
    </Link>
  )
}
