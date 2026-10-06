import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Power } from 'lucide-react'
import Odometer from '../cluster/Odometer'
import WhatsAppIcon from '../WhatsAppIcon'
import { Dial, WarningRow } from './FerrariCluster'
import useTween from './useTween'
import { TRIAL_DAYS, whatsappLink } from '../../constants/contact'
import '../launch/launch.css'

const SPEED_MAX_KMH = 320
const REV_KM = 5000
const GO_TO_SIGNUP_MS = 3400
const TACH_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const SPEED_LABELS = ['0', '40', '80', '120', '160', '200', '240', '280', '320']
const MINI = { fuel: ['E', '½', 'F'], water: ['C', '', 'H'], oil: ['100', '', '150'], press: ['0', '', '8'] }

const OFF = { tach: 0, speed: 0, fuel: 0, water: 0, oil: 0, press: 0, gear: 'N', lit: false, needleMs: 700 }
const SWEEP = { ...OFF, tach: 1, speed: 1, fuel: 1, water: 1, oil: 1, press: 1, lit: true }
const IDLE = { tach: 0.13, speed: 0, fuel: 0.72, water: 0.5, oil: 0.45, press: 0.6, gear: 'N', lit: false, needleMs: 900 }
const LAUNCH = [
  [0, SWEEP],
  [700, IDLE],
  [1500, { ...IDLE, tach: 0.62, speed: 0.12, gear: '1', needleMs: 700 }],
  [2000, { ...IDLE, tach: 0.55, speed: 0.3, gear: '2', water: 0.55, oil: 0.5, needleMs: 700 }],
  [2600, { ...IDLE, tach: 0.8, speed: 0.55, gear: '3', water: 0.58, oil: 0.55, press: 0.7, needleMs: 700 }],
]

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Landing hero as a Ferrari-style cockpit: START wakes every dial, runs through the gears, then opens signup. */
export default function HeroOdometer() {
  const navigate = useNavigate()
  const [running, setRunning] = useState(false)
  const [state, setState] = useState(OFF)
  const timers = useRef([])
  const kmh = useTween(Math.round(state.speed * SPEED_MAX_KMH), 900)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const start = () => {
    if (running) return
    setRunning(true)
    if (prefersReducedMotion()) {
      navigate('/register')
      return
    }
    timers.current = [
      ...LAUNCH.map(([ms, next]) => setTimeout(() => setState(next), ms)),
      setTimeout(() => navigate('/register'), GO_TO_SIGNUP_MS),
    ]
  }

  const mini = (key, title, unit) => (
    <Dial t={state[key]} labels={MINI[key]} minor={5} title={title} unit={unit} needleMs={state.needleMs} className="w-full" />
  )

  return (
    <header id="top" className="relative flex min-h-screen items-center bg-petrol pb-10 pt-24 text-mint">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="text-center">
          <h1 className="mx-auto max-w-[22ch] text-3xl font-bold leading-snug sm:text-5xl">كير كار يراقب الموعد بدالك.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gauge-light sm:text-lg">
            نظام واحد لكل مركز يخدم السيارات في العراق: زيوت، إطارات، غسيل، كهرباء، ميكانيك، تكييف، سمكرة، أو قطع غيار.
          </p>
        </div>

        <div className="mt-8 rounded-[2.5rem] border border-petrol-line bg-[#030808] px-3 py-6 shadow-[inset_0_2px_0_rgba(255,255,255,0.08),0_40px_80px_-40px_rgba(0,0,0,0.95)] sm:px-8 sm:py-9" dir="ltr">
          <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-[1fr_1.45fr_1fr] md:gap-6">
            <Dial t={state.speed} labels={SPEED_LABELS} minor={2} title="SPEED" unit="KM/H" needleMs={state.needleMs} className="order-2 w-full md:order-1" />

            <div className="order-1 col-span-2 mx-auto w-full max-w-[420px] md:order-2 md:col-span-1">
              <Dial t={state.tach} labels={TACH_LABELS} redFrom={0.78} minor={4} title="RPM ×1000" unit="" needleMs={state.needleMs} accent="#F0A33A">
                <text x="100" y="128" textAnchor="middle" fontSize="30" fontWeight="800" fill="#F0A33A">{state.gear}</text>
                <text x="100" y="146" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e8f1ef">{Math.round(kmh)} KM/H</text>
              </Dial>
            </div>

            <div className="order-3 grid grid-cols-2 gap-2">
              {mini('fuel', 'FUEL', '')}
              {mini('water', 'WATER', '')}
              {mini('oil', 'OIL °C', '')}
              {mini('press', 'OIL BAR', '')}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-5">
            <WarningRow lit={state.lit} />
            <div className="flex items-end gap-2">
              <Odometer value={running ? REV_KM : 0} className="text-4xl font-bold text-oil sm:text-5xl" />
              <span className="pb-1 text-gauge">KM</span>
            </div>

            <button type="button" onClick={start} disabled={running} aria-label={`START: ابدأ ${TRIAL_DAYS} يوم مجاناً`} className="group flex flex-col items-center gap-2 focus-visible:outline-none">
              <span className="relative grid h-28 w-28 place-items-center rounded-full p-[5px] shadow-[0_14px_28px_-10px_rgba(0,0,0,0.9)] group-focus-visible:ring-4 group-focus-visible:ring-oil/60">
                <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 210deg, #9aa7a6, #3d4f50, #d3dddc, #2a3b3c, #9aa7a6)' }} />
                <span aria-hidden="true" className={`${running ? '' : 'start-ring-idle'} absolute inset-[5px] rounded-full bg-[radial-gradient(circle_at_50%_30%,#134549,#061819)] shadow-[0_0_0_2px_#ff3b2f] transition-transform group-active:scale-95`} />
                <Power size={36} className={`relative ${running ? 'animate-pulse text-alert' : 'text-oil'}`} aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-[0.35em] text-oil">ENGINE START</span>
            </button>

            <p className="text-sm text-gauge-light" dir="rtl">{running ? 'جاري التشغيل...' : `اضغط وابدأ ${TRIAL_DAYS} يوم مجاناً`}</p>
            <a
              href={whatsappLink('مرحبا، أريد أعرف أكثر عن كير كار')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-petrol-soft px-4 py-2 text-sm font-bold transition hover:bg-petrol focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oil/50"
              dir="rtl"
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
