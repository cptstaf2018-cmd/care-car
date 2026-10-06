import { Link } from 'react-router-dom'
import { Power } from 'lucide-react'
import '../launch/launch.css'

const SIZES = { sm: { box: 46, icon: 16 }, md: { box: 84, icon: 26 }, lg: { box: 112, icon: 34 } }

/** The push-to-start key as a sign-up link: a chrome bezel, an amber ring and a START caption. */
export default function StartButton({ size = 'md', caption = 'START', className = '', onDark = true }) {
  const { box, icon } = SIZES[size]
  return (
    <Link to="/register" aria-label="ابدأ التجربة المجانية" className={`group inline-flex flex-col items-center gap-2 focus-visible:outline-none ${className}`}>
      <span
        style={{ width: box, height: box }}
        className="relative grid place-items-center rounded-full p-[5px] shadow-[0_14px_28px_-10px_rgba(0,0,0,0.8)] group-focus-visible:ring-4 group-focus-visible:ring-oil/60"
      >
        <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #9aa7a6, #3d4f50, #d3dddc, #2a3b3c, #9aa7a6)' }} />
        <span aria-hidden="true" className="start-ring-idle absolute inset-[5px] rounded-full bg-[radial-gradient(circle_at_50%_30%,#134549,#061819)] shadow-[0_0_0_2px_#F0A33A] transition-transform group-active:scale-95" />
        <Power size={icon} className="relative text-oil" aria-hidden="true" />
      </span>
      {caption && <span dir="ltr" className={`text-xs font-bold tracking-[0.3em] ${onDark ? 'text-oil' : 'text-petrol-deep'}`}>{caption}</span>}
    </Link>
  )
}
