import { useCallback, useEffect, useRef, useState } from 'react'

export const IGNITE_MS = 900
export const DRIVE_MS = 1400
const AWAY_BEFORE_RETURN_MS = 2600
const RETURN_MS = 1300

/** RPM (×1000) the tach shows in each phase. */
export const PHASE_RPM = { parked: 0.8, igniting: 4.2, driving: 7.4, away: 1.2, returning: 3 }

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Car launch state machine: parked → igniting → driving → away → (returning → parked).
 * `press()` starts the sequence; `hold()` keeps the car gone (sign-in succeeded);
 * `release()` brings it back right away (sign-in failed or was cancelled);
 * `msUntilGone()` says how long the launch still needs, so navigation can wait for it.
 */
export default function useLaunch() {
  const [phase, setPhase] = useState('parked')
  const timers = useRef([])
  const phaseRef = useRef('parked')
  const pressedAt = useRef(0)

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const go = useCallback((next) => {
    phaseRef.current = next
    setPhase(next)
  }, [])
  const later = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const returnHome = useCallback(() => {
    go('returning')
    later(RETURN_MS, () => go('parked'))
  }, [go, later])

  const press = useCallback(() => {
    if (phaseRef.current !== 'parked') return
    clear()
    pressedAt.current = Date.now()
    if (prefersReducedMotion()) {
      go('away')
      later(AWAY_BEFORE_RETURN_MS, () => go('parked'))
      return
    }
    go('igniting')
    later(IGNITE_MS, () => go('driving'))
    later(IGNITE_MS + DRIVE_MS, () => go('away'))
    later(IGNITE_MS + DRIVE_MS + AWAY_BEFORE_RETURN_MS, returnHome)
  }, [go, later, returnHome])

  const hold = useCallback(() => {
    clear()
    const current = phaseRef.current
    if (current === 'igniting' || current === 'driving') {
      const remaining = Math.max(0, IGNITE_MS + DRIVE_MS - (Date.now() - pressedAt.current))
      later(remaining, () => go('away'))
    } else if (current === 'returning') {
      go('away')
    }
  }, [go, later])

  const release = useCallback(() => {
    clear()
    const current = phaseRef.current
    if (current === 'away') {
      returnHome()
    } else if (current === 'igniting' || current === 'driving') {
      const remaining = Math.max(0, IGNITE_MS + DRIVE_MS - (Date.now() - pressedAt.current))
      later(remaining, returnHome)
    }
  }, [later, returnHome])

  const msUntilGone = useCallback(() => {
    const current = phaseRef.current
    if (current === 'igniting' || current === 'driving') {
      return Math.max(0, IGNITE_MS + DRIVE_MS - (Date.now() - pressedAt.current))
    }
    return 0
  }, [])

  useEffect(() => clear, [])

  return { phase, press, hold, release, msUntilGone }
}
