const CX = 100
const CY = 100
const R = 80
const SWEEP_DEG = 240 // needle travels from -120° to +120° around 12 o'clock, like a real cluster
const MAJOR_TICKS = 5
const MINOR_PER_MAJOR = 4
const ARC_LENGTH = ((R + 4) * SWEEP_DEG * Math.PI) / 180

const clamp01 = (n) => Math.min(1, Math.max(0, n))
const angleFor = (t) => -SWEEP_DEG / 2 + SWEEP_DEG * t

function polar(deg, radius) {
  const rad = (deg * Math.PI) / 180
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)]
}

function arcPath(t0, t1, radius) {
  const [x0, y0] = polar(angleFor(t0), radius)
  const [x1, y1] = polar(angleFor(t1), radius)
  const large = (t1 - t0) * SWEEP_DEG > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`
}

const NEEDLE_TIMING = {
  off: 'transform 0s',
  sweep: 'transform 650ms cubic-bezier(.3,.9,.3,1)',
  settling: 'transform 1000ms cubic-bezier(.5,0,.2,1)',
  ready: 'transform 900ms cubic-bezier(.3,.9,.3,1)',
}

/**
 * Analog dial. `value`/`max` place the needle; `average` draws the center's usual mark;
 * `phase` comes from useIgnition so the needle can do the start-up sweep.
 */
export default function Gauge({ value = 0, max, average, scaleLabel, unitLabel, readout, title, phase = 'ready' }) {
  const t = phase === 'off' ? 0 : phase === 'sweep' ? 1 : clamp01(value / max)
  const avgT = average ? clamp01(average / max) : null
  const ticks = []
  const total = MAJOR_TICKS * MINOR_PER_MAJOR
  for (let i = 0; i <= total; i++) {
    const major = i % MINOR_PER_MAJOR === 0
    const deg = angleFor(i / total)
    const [x0, y0] = polar(deg, R - (major ? 12 : 6))
    const [x1, y1] = polar(deg, R)
    ticks.push(<line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="currentColor" strokeWidth={major ? 2.4 : 1.2} opacity={major ? 0.9 : 0.45} />)
    if (major) {
      const [lx, ly] = polar(deg, R - 24)
      ticks.push(
        <text key={`l${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="10" fill="currentColor" opacity="0.8">
          {scaleLabel((max * i) / total)}
        </text>,
      )
    }
  }
  const [ax, ay] = avgT != null ? polar(angleFor(avgT), R + 6) : [0, 0]

  return (
    <figure className="relative mx-auto w-full max-w-[260px] text-gauge-light">
      <svg viewBox="0 0 200 172" className="w-full" role="img" aria-label={`${title}: ${readout}`}>
        <defs>
          <radialGradient id="dialFace" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#0f4a4e" />
            <stop offset="100%" stopColor="#082628" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={R + 12} fill="url(#dialFace)" stroke="#1D5A5E" strokeWidth="2" />
        <path d={arcPath(0, 1, R + 4)} fill="none" stroke="#1D5A5E" strokeWidth="4" strokeLinecap="round" />
        <path
          d={arcPath(0, 1, R + 4)}
          fill="none"
          stroke="#F0A33A"
          strokeWidth="4"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH * (1 - t)}
          style={{ transition: NEEDLE_TIMING[phase].replace('transform', 'stroke-dashoffset') }}
        />
        {ticks}
        {avgT != null && phase === 'ready' && <circle cx={ax} cy={ay} r="3" fill="#E8F1EF"><title>معدّلك</title></circle>}
        <text x={CX} y={CY + 30} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.7">{unitLabel}</text>
        <g
          style={{
            transform: `rotate(${angleFor(t)}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transformBox: 'view-box',
            transition: NEEDLE_TIMING[phase],
          }}
        >
          <path d={`M ${CX - 2.5} ${CY + 10} L ${CX} ${CY - R + 8} L ${CX + 2.5} ${CY + 10} Z`} fill="#F0A33A" />
        </g>
        <circle cx={CX} cy={CY} r="8" fill="#0D3B3E" stroke="#F0A33A" strokeWidth="2" />
      </svg>
      <figcaption className="-mt-7 text-center">
        <b className="block text-xl font-bold tabular-nums text-mint" dir="ltr">{readout}</b>
        <span className="text-xs">{title}</span>
      </figcaption>
    </figure>
  )
}
