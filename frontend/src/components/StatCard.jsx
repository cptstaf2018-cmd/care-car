import { motion } from 'framer-motion'

// Legacy `color` names map onto the four instrument tones.
const TONE_FOR_COLOR = { blue: 'amber', orange: 'amber', purple: 'amber', cyan: 'amber', green: 'ok', emerald: 'ok', red: 'alert', rose: 'alert', slate: 'plain' }
const TONE_HEX = { amber: '#F0A33A', ok: '#4CC38A', alert: '#E5533D', plain: '#A9C2BF' }
const RING_SIZE = 44
const RING_STROKE = 4
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** Icon inside a gauge ring; `fraction` (0–1) fills the ring like a level, otherwise it just frames the icon. */
function RingIcon({ icon: Icon, tone, fraction }) {
  const hex = TONE_HEX[tone]
  const level = fraction == null ? 1 : Math.min(1, Math.max(0, fraction))
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="#1D5A5E" strokeWidth={RING_STROKE} />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={hex}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeOpacity={fraction == null ? 0.35 : 1}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - level)}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.3,.9,.3,1)' }}
        />
      </svg>
      {typeof Icon === 'string' ? (
        <span className="text-xs font-bold" style={{ color: hex }}>{Icon}</span>
      ) : (
        <Icon size={18} strokeWidth={2.2} style={{ color: hex }} aria-hidden="true" />
      )}
    </span>
  )
}

/** Instrument tile: a number on the petrol dashboard with a level ring around its icon. */
export default function StatCard({ label, value, icon, color = 'blue', tone, fraction, trend, helper, loading }) {
  const resolvedTone = tone || TONE_FOR_COLOR[color] || 'amber'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-petrol-line/50 bg-petrol p-4 text-mint shadow-[0_18px_30px_-22px_rgba(8,38,40,0.9)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-1 text-xs font-medium text-gauge-light">{label}</div>
        <RingIcon icon={icon} tone={resolvedTone} fraction={fraction} />
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded-md bg-petrol-line/60" />
      ) : (
        <div className="mt-1 break-words text-[22px] font-bold leading-tight tabular-nums" dir="auto">{value ?? '—'}</div>
      )}
      {(trend || helper) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {trend && <span className="rounded-full bg-petrol-deep px-2.5 py-1 text-xs font-bold" style={{ color: TONE_HEX[resolvedTone] }}>{trend}</span>}
          {helper && <span className="truncate text-xs text-gauge">{helper}</span>}
        </div>
      )}
    </motion.div>
  )
}
