import { useEffect, useRef, useState } from 'react'

const FULL_AT_VIEWPORT_FRACTION = 0.85 // progress reaches 1 once the element's top is this far up the screen

const clamp01 = (n) => Math.min(1, Math.max(0, n))

/**
 * 0 → 1 as the referenced element scrolls into view. It starts at 0 on mount and eases to its real
 * value on the next frame, so gauges always sweep in once, even when the element is already on screen.
 */
export default function useScrollProgress() {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const measure = () => {
      const el = ref.current
      if (!el) return
      const { top } = el.getBoundingClientRect()
      const vh = window.innerHeight
      setProgress(clamp01((vh - top) / (vh * FULL_AT_VIEWPORT_FRACTION)))
    }
    const first = window.requestAnimationFrame(() => window.requestAnimationFrame(measure))
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(first)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return [ref, progress]
}
