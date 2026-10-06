import { Link } from 'react-router-dom'
import { Power } from 'lucide-react'

/** Push-to-start button that opens a new service. */
export default function StartButton() {
  return (
    <Link
      to="/center/services/new"
      className="group relative mx-auto -mt-9 grid h-[104px] w-[104px] place-items-center rounded-full bg-gradient-to-b from-[#1b2b2c] to-[#050f10] p-[5px] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/60"
    >
      <span className="absolute inset-[5px] rounded-full ring-2 ring-oil/70 transition group-hover:ring-oil group-active:ring-4" />
      <span className="grid h-full w-full place-items-center rounded-full bg-gradient-to-b from-[#123f42] to-petrol-deep text-center transition-transform group-active:scale-95">
        <span className="flex flex-col items-center leading-tight">
          <Power size={20} className="text-oil" aria-hidden="true" />
          <span dir="ltr" className="mt-0.5 text-[10px] font-bold tracking-wider text-gauge-light">START</span>
          <span className="text-sm font-bold text-mint">خدمة جديدة</span>
        </span>
      </span>
    </Link>
  )
}
