const PLACES = [1000, 100, 10, 1]
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] // the extra 0 lets 9 → 0 roll forward
const WHEEL_HEIGHT_EM = 1.15

/**
 * Where a wheel sits (0–10) for a continuous distance. Like a real odometer, a wheel only
 * turns while every wheel to its right is passing from 9 to 0.
 */
function wheelPosition(km, place) {
  if (place === 1) return km % 10
  const base = Math.floor(km / place) % 10
  const rem = km % place
  const carryStart = place - 1
  return base + (rem > carryStart ? (rem - carryStart) / (place - carryStart) : 0)
}

/** Four-wheel km odometer that follows `value` continuously (scroll-driven, no per-digit delays). */
export default function Odometer({ value, className = '' }) {
  const km = Math.max(0, Math.min(9999, value))
  return (
    <span dir="ltr" role="img" aria-label={`${Math.round(km)} كم`} className={`inline-flex items-center gap-1 ${className}`}>
      {PLACES.map((place, i) => (
        <span key={place} className="inline-flex items-center gap-1">
          {i === 1 && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-petrol-line" />}
          <span
            aria-hidden="true"
            style={{ height: `${WHEEL_HEIGHT_EM}em`, width: '0.68em' }}
            className="relative block overflow-hidden rounded-[3px] bg-petrol-deep shadow-[inset_0_7px_7px_-5px_rgba(0,0,0,.75),inset_0_-7px_7px_-5px_rgba(0,0,0,.75)]"
          >
            <span
              className="absolute inset-x-0 top-0 flex flex-col text-center transition-transform duration-150 ease-linear"
              style={{ transform: `translateY(-${wheelPosition(km, place) * WHEEL_HEIGHT_EM}em)` }}
            >
              {DIGITS.map((d, j) => (
                <span key={j} style={{ height: `${WHEEL_HEIGHT_EM}em`, lineHeight: `${WHEEL_HEIGHT_EM}em` }} className="block">{d}</span>
              ))}
            </span>
          </span>
        </span>
      ))}
    </span>
  )
}
