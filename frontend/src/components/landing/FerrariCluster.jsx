const CX = 100
const CY = 100
const SWEEP = 270
const START_DEG = -SWEEP / 2
const clamp01 = (n) => Math.min(1, Math.max(0, n))
const angleFor = (t) => START_DEG + SWEEP * t

function polar(deg, radius) {
  const rad = (deg * Math.PI) / 180
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)]
}

function arc(t0, t1, radius) {
  const [x0, y0] = polar(angleFor(t0), radius)
  const [x1, y1] = polar(angleFor(t1), radius)
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${(t1 - t0) * SWEEP > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/** A single carbon-faced dial. `t` is the needle position 0–1; `labels` are printed at evenly spaced major ticks. */
export function Dial({ t, labels, redFrom, title, unit, accent = '#F0A33A', needleMs = 1100, minor = 4, children, className = '' }) {
  const majors = labels.length - 1
  const total = majors * minor
  const ticks = []
  for (let i = 0; i <= total; i++) {
    const major = i % minor === 0
    const pos = i / total
    const red = redFrom != null && pos >= redFrom
    const deg = angleFor(pos)
    const [x0, y0] = polar(deg, major ? 70 : 77)
    const [x1, y1] = polar(deg, 84)
    ticks.push(<line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={red ? '#ff4b3a' : '#e8f1ef'} strokeWidth={major ? 2.6 : 1.1} opacity={major ? 1 : 0.55} />)
    if (major) {
      const [lx, ly] = polar(deg, 56)
      ticks.push(<text key={`l${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill={red ? '#ff4b3a' : '#e8f1ef'}>{labels[i / minor]}</text>)
    }
  }

  return (
    <figure className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)]" role="img" aria-label={title}>
        <defs>
          <linearGradient id="dialChrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9f0ef" />
            <stop offset="0.35" stopColor="#566768" />
            <stop offset="0.6" stopColor="#dfe8e7" />
            <stop offset="1" stopColor="#2a3b3c" />
          </linearGradient>
          <radialGradient id="dialCarbon" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#14201f" />
            <stop offset="1" stopColor="#020505" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="98" fill="url(#dialChrome)" />
        <circle cx={CX} cy={CY} r="92" fill="url(#dialCarbon)" />
        <path d={arc(0, 1, 88)} fill="none" stroke={accent} strokeWidth="2" opacity="0.8" />
        {redFrom != null && <path d={arc(redFrom, 1, 88)} fill="none" stroke="#ff4b3a" strokeWidth="4" />}
        {ticks}
        <text x={CX} y={CY + 46} textAnchor="middle" fontSize="9" letterSpacing="1.5" fill={accent}>{unit}</text>
        {children}
        <g style={{ transform: `rotate(${angleFor(clamp01(t))}deg)`, transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box', transition: `transform ${needleMs}ms cubic-bezier(.2,.8,.2,1)` }}>
          <path d={`M ${CX - 2.4} ${CY + 18} L ${CX} ${CY - 84} L ${CX + 2.4} ${CY + 18} Z`} fill="#ff3b2f" />
        </g>
        <circle cx={CX} cy={CY} r="9" fill="url(#dialChrome)" />
        <circle cx={CX} cy={CY} r="4" fill="#020505" />
      </svg>
      <figcaption className="-mt-2 text-center text-[11px] font-bold tracking-widest text-gauge-light">{title}</figcaption>
    </figure>
  )
}

const WARNINGS = ['ENGINE', 'OIL', 'BATT', 'ABS', 'BELT']

/** Warning lights that all glow when the key turns, then go dark once the engine runs. */
export function WarningRow({ lit }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2" aria-hidden="true">
      {WARNINGS.map((w) => (
        <li key={w} className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-widest transition-all duration-300 ${lit ? 'border-alert bg-alert/20 text-alert shadow-[0_0_14px_rgba(229,83,61,0.6)]' : 'border-petrol-line text-petrol-soft'}`}>{w}</li>
      ))}
    </ul>
  )
}
