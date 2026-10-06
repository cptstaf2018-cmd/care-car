import Gauge from '../cluster/Gauge'
import Odometer from '../cluster/Odometer'
import useScrollProgress from '../cluster/useScrollProgress'
import { BatteryWarning } from 'lucide-react'
import { TRIAL_DAYS } from '../../constants/contact'
import '../launch/launch.css'

const TACH_MAX_RPM = 8
const OIL_INTERVAL_KM = 5000
const FUEL_START = 0.9
const FUEL_DRAIN = 0.72
const DEBT_LAMP_AT = 0.6
const STEPS = ['حسابك', 'مركزك', 'انطلق']
const FUEL_LABELS = { 0: 'E', 1: 'F' }

function Instrument({ title, text, children }) {
  return (
    <article className="rounded-3xl border border-petrol-line bg-petrol-deep/60 p-4 text-center">
      <div className="flex min-h-[132px] items-center justify-center">{children}</div>
      <h3 className="mt-3 text-base font-bold text-mint">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-gauge-light">{text}</p>
    </article>
  )
}

/**
 * Four instruments that explain the product while you sign up. They sweep in as the block scrolls into
 * view, and the RPM dial follows the registration step (`rpm`, `step`).
 */
export default function FeatureGauges({ step = 1, rpm = 1.5 }) {
  const [ref, progress] = useScrollProgress()
  const fuel = FUEL_START - FUEL_DRAIN * progress
  const debtLit = progress >= DEBT_LAMP_AT

  return (
    <div ref={ref} className="feature-gauges">
      <p className="text-gauge-light">زبونك اللي يبدّل اليوم، يرجع بعد 5,000 كم.</p>
      <h2 className="mt-2 max-w-[20ch] text-3xl font-bold leading-snug sm:text-4xl">كير كار يذكّره بوقته، فيرجع لمركزك.</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Instrument title="نبض مركزك" text="يعلى كل ما زاد شغلك اليوم. وهنا يعلى مع كل خطوة تكمّلها.">
          <div className="w-full max-w-[190px]">
            <Gauge
              value={rpm * progress}
              max={TACH_MAX_RPM}
              scaleLabel={(n) => `${Math.round(n)}`}
              unitLabel="RPM ×1000"
              readout=""
              title=""
              compact
            />
            <ol className="-mt-2 flex justify-between gap-1 text-[11px]" aria-label="خطوات التسجيل">
              {STEPS.map((label, i) => (
                <li key={label} aria-current={step === i + 1 ? 'step' : undefined} className={`flex-1 border-t-2 pt-1 ${step >= i + 1 ? 'border-oil text-mint' : 'border-petrol-line text-gauge'}`}>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </Instrument>

        <Instrument title="عدّاد الموعد" text={`كل سيارة تعدّ مسافتها، وعند ${OIL_INTERVAL_KM.toLocaleString('en-US')} كم يوصل زبونك تذكير واتساب.`}>
          <div className="grid justify-items-center gap-2">
            <Odometer value={progress * OIL_INTERVAL_KM} className="text-4xl font-bold text-oil" />
            <span className="text-xs text-gauge">كم</span>
          </div>
        </Instrument>

        <Instrument title="مقياس المخزون" text="ينزل مع كل خدمة، وتضوي لمبته قبل ما يخلص الزيت والفلاتر.">
          <div className="w-full max-w-[190px]">
            <Gauge
              value={fuel}
              max={1}
              scaleLabel={(n) => FUEL_LABELS[n] ?? ''}
              unitLabel="مخزون"
              readout=""
              title=""
              compact
            />
          </div>
        </Instrument>

        <Instrument title="لمبة الديون" text="تضوي لما أحد يتأخر عليك، وتطالبه برسالة واتساب مرتبة.">
          <div className="grid justify-items-center gap-3">
            <span
              className={`grid h-20 w-20 place-items-center rounded-full border-2 transition-all duration-500 ${
                debtLit ? 'border-alert bg-alert/15 text-alert shadow-[0_0_30px_6px_rgba(229,83,61,0.45)]' : 'border-petrol-line text-petrol-soft'
              }`}
            >
              <BatteryWarning size={34} aria-hidden="true" />
            </span>
            <span className="text-xs text-gauge">{debtLit ? '3 ديون متأخرة' : 'ما كو ديون'}</span>
          </div>
        </Instrument>
      </div>

      <p className="mt-6 inline-block rounded-full bg-petrol-deep px-4 py-2 text-sm text-gauge-light">
        {TRIAL_DAYS} يوم مجاناً بكل الميزات، بدون دفع.
      </p>
    </div>
  )
}
