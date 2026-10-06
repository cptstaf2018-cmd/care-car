import { OilCanIcon } from '../cluster/Telltale'

const SEGMENTS = 10
const LOW_FRACTION = 0.25

/**
 * How much oil life a car has left: a small fuel bar that drains toward the next change.
 * `daysLeft` null means the car has never been serviced here.
 */
export default function OilLife({ daysLeft, intervalDays }) {
  if (daysLeft == null) {
    return (
      <p className="flex items-center gap-2 text-xs text-mint-ink">
        <OilCanIcon size={16} />
        ما انخدمت عندك بعد، فما كو موعد.
      </p>
    )
  }
  const fraction = Math.min(1, Math.max(0, daysLeft / intervalDays))
  const filled = daysLeft <= 0 ? 0 : Math.max(1, Math.round(fraction * SEGMENTS))
  const overdue = daysLeft < 0
  const low = fraction <= LOW_FRACTION
  const tone = overdue || low ? 'text-alert' : 'text-petrol'
  const text = overdue ? `متأخر ${-daysLeft} يوم` : daysLeft === 0 ? 'موعده اليوم' : `باقي ${daysLeft} يوم`

  return (
    <div role="img" aria-label={`عمر الزيت: ${text}`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className={`inline-flex items-center gap-1.5 font-bold ${tone}`}>
          <OilCanIcon size={16} />
          عمر الزيت
        </span>
        <span className={`font-bold ${tone}`}>{text}</span>
      </div>
      <div className="flex gap-[3px]" dir="ltr">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-2.5 flex-1 rounded-[3px] ${i < filled ? (low ? 'bg-alert' : 'bg-oil') : 'bg-mint-dim'} ${overdue && i === 0 ? 'animate-pulse bg-alert' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
