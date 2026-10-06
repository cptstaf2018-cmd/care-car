import Gauge from '../cluster/Gauge'
import { PHASE_RPM } from './useLaunch'
import './launch.css'

const TACH_MAX_RPM = 8
const STREAKS = [14, 27, 41, 55, 68, 80]
const STREAK_DELAYS = [0, 0.13, 0.27, 0.06, 0.2, 0.34]

/**
 * The red car on its garage road with a live RPM dial. `phase` comes from useLaunch;
 * `idleRpm` lets a form raise the idle revs as the user fills it in.
 */
export default function LaunchScene({ phase, idleRpm = PHASE_RPM.parked, label = 'سيارة كير كار الحمراء' }) {
  const rpm = phase === 'parked' ? idleRpm : PHASE_RPM[phase]

  return (
    <div className="launch-scene" data-phase={phase} role="img" aria-label={label}>
      <svg className="launch-rings" viewBox="0 0 400 300" aria-hidden="true" fill="none" stroke="#1D5A5E" strokeWidth="1.2">
        <circle cx="200" cy="150" r="140" />
        <circle cx="200" cy="150" r="104" strokeDasharray="2 7" />
        <circle cx="200" cy="150" r="68" />
      </svg>

      <div className="absolute start-3 top-2 hidden w-[112px] min-[460px]:block" aria-hidden="true">
        <Gauge value={rpm} max={TACH_MAX_RPM} scaleLabel={(n) => `${Math.round(n)}`} unitLabel="RPM" readout="" title="" compact />
      </div>

      <div className="launch-road" aria-hidden="true" />
      {STREAKS.map((top, i) => (
        <span key={top} className="launch-streak" style={{ top: `${top}%`, animationDelay: `${STREAK_DELAYS[i]}s` }} aria-hidden="true" />
      ))}

      <div className="launch-car" aria-hidden="true">
        <span className="launch-shadow" />
        <img src="/hero/ferrari.webp" alt="" width="1100" height="292" draggable="false" />
        <span className="launch-beam" />
        <span className="launch-headlight" />
        <span className="launch-taillight" />
        <span className="launch-wheel front" />
        <span className="launch-wheel rear" />
        <span className="launch-puff" />
        <span className="launch-puff" />
        <span className="launch-puff" />
      </div>
    </div>
  )
}
