import { useEffect, useRef, useState } from 'react'

const clamp01 = (n) => Math.min(1, Math.max(0, n))

/** Eases a number toward `target` so digital readouts roll like the needles instead of jumping. */
export default function useTween(target, ms = 1100) {
  const [value, setValue] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const begin = performance.now()
    const start = from.current
    let frame = 0
    const tick = (now) => {
      const k = clamp01((now - begin) / ms)
      const next = start + (target - start) * (1 - (1 - k) ** 3)
      from.current = next
      setValue(next)
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])
  return value
}
