import { useEffect, useState } from 'react'

const TICK_MS = 1000

/** Whole seconds since `startedAt` (a Date), ticking every second; 0 when there is no start. */
export default function useElapsed(startedAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt) return undefined
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [startedAt])

  return startedAt ? Math.max(0, Math.floor((now - startedAt.getTime()) / TICK_MS)) : 0
}

/** 75 → "01:15", 3725 → "1:02:05". */
export function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
