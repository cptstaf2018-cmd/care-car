import { Check } from 'lucide-react'
import IraqiPlate from '../car/IraqiPlate'
import useElapsed, { formatElapsed } from './useElapsed'

const STEPS = ['دخلت المحطة', 'اختيار الخدمات', 'جاهزة للفاتورة', 'خرجت']

/**
 * The pit-stop: the car's plate, the four stops it passes through, and a live timer that starts the
 * moment the car is picked. The start time travels with the invoice so the ticket can show the duration.
 */
export default function PitStopBar({ car, startedAt, linesCount, onChange }) {
  const seconds = useElapsed(startedAt)
  const current = linesCount === 0 ? 1 : 2

  return (
    <section aria-label="محطة الخدمة" className="mb-5 grid gap-4 rounded-3xl bg-petrol p-4 text-mint lg:grid-cols-[auto_1fr_auto] lg:items-center">
      <div className="flex items-center justify-between gap-4 lg:justify-start">
        <IraqiPlate plate={car.plate_number} size="lg" />
        <div className="min-w-0 lg:ms-1">
          <p className="truncate font-bold">{car.owner_name || 'زبون'}</p>
          <p className="truncate text-xs text-gauge-light">{car.car_type || 'نوع السيارة غير محدد'}</p>
          <button onClick={onChange} className="mt-1 text-xs font-bold text-oil underline underline-offset-4">غيّر السيارة</button>
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-1" aria-label="مراحل الخدمة">
        {STEPS.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} aria-current={active ? 'step' : undefined} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold transition-colors ${
                  done ? 'border-oil bg-oil text-petrol-deep' : active ? 'start-ring-idle border-oil text-oil' : 'border-petrol-line text-gauge'
                }`}
              >
                {done ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-[11px] leading-tight ${done || active ? 'font-bold text-mint' : 'text-gauge'}`}>{label}</span>
            </li>
          )
        })}
      </ol>

      <div className="text-center lg:text-end">
        <p className="text-xs text-gauge-light">مدة السيارة بالمحطة</p>
        <p role="timer" dir="ltr" className="mt-1 inline-block rounded-xl bg-petrol-deep px-4 py-1.5 text-3xl font-bold tabular-nums text-oil shadow-[inset_0_6px_8px_-6px_rgba(0,0,0,.8)]">
          {formatElapsed(seconds)}
        </p>
      </div>
    </section>
  )
}
