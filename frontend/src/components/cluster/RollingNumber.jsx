const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Odometer-style number: each digit is a wheel that rolls to its value. */
export default function RollingNumber({ value, className = '' }) {
  const text = Math.round(value || 0).toLocaleString('en-US')
  return (
    <span dir="ltr" className={`inline-flex items-center tabular-nums ${className}`} aria-label={text}>
      {[...text].map((ch, i) =>
        ch === ',' ? (
          <span key={`s${i}`} aria-hidden="true" className="mx-px self-end pb-1 text-[0.6em] opacity-60">,</span>
        ) : (
          <span
            key={text.length - i}
            aria-hidden="true"
            className="relative inline-block h-[1.15em] w-[0.68em] overflow-hidden rounded-[3px] bg-petrol-deep text-center shadow-[inset_0_6px_6px_-4px_rgba(0,0,0,.7),inset_0_-6px_6px_-4px_rgba(0,0,0,.7)]"
          >
            <span
              className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(ch) * 1.15}em)`, transitionDelay: `${i * 70}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.15em] leading-[1.15em]">{d}</span>
              ))}
            </span>
          </span>
        ),
      )}
    </span>
  )
}
