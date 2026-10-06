const SEGMENTS = 10
const LOW_FRACTION = 0.25

/** Fuel-tank bar: each day of the trial/subscription is fuel, and the lamp goes red when it runs low. */
export default function TankGauge({ days, total, kind, compact = false }) {
  const fraction = Math.min(1, days / total)
  const filled = days > 0 ? Math.max(1, Math.round(fraction * SEGMENTS)) : 0
  const low = fraction <= LOW_FRACTION
  const title = kind === 'trial' ? 'خزان التجربة' : 'خزان الاشتراك'
  const text = days === 0 ? 'فرغ الخزان' : days === 1 ? 'باقي يوم واحد' : `باقي ${days} يوم`

  return (
    <div role="img" aria-label={`${title}: ${text}`} className="rounded-2xl border border-petrol-line bg-petrol p-3">
      <div className="flex items-center justify-between gap-2">
        {!compact && <b className="text-sm text-mint">{title}</b>}
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${low ? 'text-alert' : 'text-oil'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${low ? 'animate-pulse bg-alert shadow-[0_0_8px_2px_rgba(229,83,61,0.7)]' : 'bg-oil'}`} />
          {text}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5" dir="ltr">
        <span className="text-[10px] font-bold text-gauge">E</span>
        <div className="flex flex-1 gap-[3px]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-3 flex-1 rounded-[3px] transition-colors duration-500 ${i < filled ? (low ? 'bg-alert' : 'bg-oil') : 'bg-petrol-deep'}`}
              style={{ transitionDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-gauge">F</span>
      </div>
    </div>
  )
}
