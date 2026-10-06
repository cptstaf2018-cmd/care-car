import { useEffect, useState } from 'react'

const SESSION_KEY = 'carecar-cluster-ignited'
const SWEEP_START_MS = 150
const SWEEP_PEAK_MS = 850
const SETTLED_MS = 1900

function alreadyIgnited() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Car-start sequence for the instrument cluster, once per browser session:
 * 'off' (needles at zero, every warning light on) → 'sweep' (needles to max) → 'settling' → 'ready'.
 */
export default function useIgnition() {
  const [phase, setPhase] = useState(() => (alreadyIgnited() ? 'ready' : 'off'))

  useEffect(() => {
    if (phase === 'ready') return undefined
    const timers = [
      setTimeout(() => setPhase('sweep'), SWEEP_START_MS),
      setTimeout(() => setPhase('settling'), SWEEP_PEAK_MS),
      setTimeout(() => {
        setPhase('ready')
        try {
          window.sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
          /* private mode: the sweep simply runs again next visit */
        }
      }, SETTLED_MS),
    ]
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run the sequence once on mount
  }, [])

  return phase
}
