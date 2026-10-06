import { useEffect, useRef, useState } from 'react'

const clamp01 = (n) => Math.min(1, Math.max(0, n))

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Progress (0–1) through a tall "pinned" section: 0 when its top reaches the screen top, 1 when its
 * bottom reaches the screen bottom. With reduced motion it reports 1 and `still` is true, so the page
 * can show the finished state without a long scroll.
 */
export default function useSectionScroll() {
  const ref = useRef(null)
  const [still] = useState(prefersReducedMotion)
  const [progress, setProgress] = useState(still ? 1 : 0)

  useEffect(() => {
    if (still) return undefined
    const measure = () => {
      const el = ref.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const travel = height - window.innerHeight
      setProgress(travel > 0 ? clamp01(-top / travel) : 1)
    }
    const first = window.requestAnimationFrame(measure)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(first)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [still])

  return [ref, progress, still]
}
