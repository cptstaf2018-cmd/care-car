import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Power } from 'lucide-react'
import Gauge from '../cluster/Gauge'
import Odometer from '../cluster/Odometer'
import WhatsAppIcon from '../WhatsAppIcon'
import { TRIAL_DAYS, whatsappLink } from '../../constants/contact'
import '../launch/launch.css'

const RPM_MAX = 8
const SPEED_MAX = 240
const FUEL_IDLE = 0.7
const IDLE_RPM = 0.9
const REV_RPM = 7.2
const REV_SPEED = 205
const REV_KM = 5000
const SPEED_DELAY_MS = 450
const GO_TO_SIGNUP_MS = 2600

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Landing hero as a car dashboard: pressing START revs the dials for a couple of seconds, then opens signup. */
export default function HeroOdometer() {
  const navigate = useNavigate()
  const [revving, setRevving] = useState(false)
  const [speedUp, setSpeedUp] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const start = () => {
    if (revving) return
    setRevving(true)
    const wait = prefersReducedMotion() ? 0 : GO_TO_SIGNUP_MS
    timers.current = [
      setTimeout(() => setSpeedUp(true), SPEED_DELAY_MS),
      setTimeout(() => navigate('/register'), wait),
    ]
  }

  const rpm = revving ? REV_RPM : IDLE_RPM
  const speed = speedUp ? REV_SPEED : 0

  return (
    <header id="top" className="relative flex min-h-screen items-center bg-petrol pb-10 pt-24 text-mint">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="text-center">
          <h1 className="mx-auto max-w-[22ch] text-3xl font-bold leading-snug sm:text-5xl">كير كار يراقب الموعد بدالك.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gauge-light sm:text-lg">
            نظام واحد لكل مركز يخدم السيارات في العراق: زيوت، إطارات، غسيل، كهرباء، ميكانيك، تكييف، سمكرة، أو قطع غيار.
          </p>
        </div>

        <div className="mt-8 rounded-[2.5rem] border border-petrol-line bg-petrol-deep px-3 py-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.06),0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:px-8 sm:py-9">
          <div className="grid items-center gap-2 md:grid-cols-[1fr_1.35fr_1fr]">
            <div className="hidden md:block" dir="ltr">
              <Gauge value={speed} max={SPEED_MAX} scaleLabel={(n) => `${Math.round(n)}`} unitLabel="كم/س" readout="" title="" compact />
            </div>
            <div dir="ltr" className="mx-auto w-full max-w-[340px]">
              <Gauge value={rpm} max={RPM_MAX} scaleLabel={(n) => `${Math.round(n)}`} unitLabel="RPM ×1000" readout="" title="" compact />
            </div>
            <div className="hidden md:block" dir="ltr">
              <Gauge value={FUEL_IDLE} max={1} scaleLabel={(n) => ({ 0: 'E', 1: 'F' })[n] ?? ''} unitLabel="مخزون" readout="" title="" compact />
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center gap-5">
            <div className="flex items-end gap-2" dir="ltr">
              <Odometer value={revving ? REV_KM : 0} className="text-4xl font-bold text-oil sm:text-5xl" />
              <span className="pb-1 text-gauge">كم</span>
            </div>

            <button type="button" onClick={start} disabled={revving} aria-label={`START: ابدأ ${TRIAL_DAYS} يوم مجاناً`} className="group flex flex-col items-center gap-2 focus-visible:outline-none">
              <span className="relative grid h-28 w-28 place-items-center rounded-full p-[5px] shadow-[0_14px_28px_-10px_rgba(0,0,0,0.8)] group-focus-visible:ring-4 group-focus-visible:ring-oil/60">
                <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #9aa7a6, #3d4f50, #d3dddc, #2a3b3c, #9aa7a6)' }} />
                <span aria-hidden="true" className={`${revving ? '' : 'start-ring-idle'} absolute inset-[5px] rounded-full bg-[radial-gradient(circle_at_50%_30%,#134549,#061819)] shadow-[0_0_0_2px_#F0A33A] transition-transform group-active:scale-95`} />
                <Power size={36} className={`relative text-oil ${revving ? 'animate-pulse' : ''}`} aria-hidden="true" />
              </span>
              <span dir="ltr" className="text-sm font-bold tracking-[0.35em] text-oil">START</span>
            </button>

            <p className="text-sm text-gauge-light">{revving ? 'جاري التشغيل...' : `اضغط START وابدأ ${TRIAL_DAYS} يوم مجاناً`}</p>
            <a
              href={whatsappLink('مرحبا، أريد أعرف أكثر عن كير كار')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-petrol-soft px-4 py-2 text-sm font-bold transition hover:bg-petrol focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50"
            >
              <WhatsAppIcon size={16} />
              كلّمنا على واتساب
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
