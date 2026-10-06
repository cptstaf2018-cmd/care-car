const SEGMENTS = 12
const FULL_TANK_MULTIPLE = 4 // the tank is drawn 4× the alert level, so the red tick sits at the quarter mark

/**
 * Tank-style level bar for stock: segments fill with the quantity, and a red tick marks the alert
 * threshold. Goes red and pulses once the quantity reaches the threshold.
 */
export default function FuelLevel({ quantity, threshold, unitLabel = '' }) {
  const alertAt = Math.max(Number(threshold) || 0, 0)
  const qty = Math.max(Number(quantity) || 0, 0)
  const capacity = Math.max(alertAt * FULL_TANK_MULTIPLE, qty, 1)
  const filled = qty > 0 ? Math.max(1, Math.round((qty / capacity) * SEGMENTS)) : 0
  const tickAt = Math.round((alertAt / capacity) * SEGMENTS)
  const low = qty <= alertAt

  return (
    <div role="img" aria-label={`${qty} ${unitLabel}${low ? '، وصل للحد الأدنى' : ''}`} className="flex items-center gap-1.5" dir="ltr">
      <span className="text-[10px] font-bold text-gauge">E</span>
      <div className="relative flex flex-1 gap-[3px]">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-3.5 flex-1 rounded-[3px] transition-colors duration-500 ${
              i < filled ? (low ? 'animate-pulse bg-alert' : 'bg-oil') : 'bg-mint-dim'
            }`}
            style={{ transitionDelay: `${i * 30}ms` }}
          />
        ))}
        {tickAt > 0 && tickAt < SEGMENTS && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 h-6 w-0.5 rounded-full bg-alert"
            style={{ left: `calc(${(tickAt / SEGMENTS) * 100}% - 1px)` }}
          />
        )}
      </div>
      <span className="text-[10px] font-bold text-gauge">F</span>
    </div>
  )
}
