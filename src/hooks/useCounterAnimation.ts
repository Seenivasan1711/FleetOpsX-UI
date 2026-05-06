import { useState, useEffect } from 'react'

export function useCounterAnimation(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }

    const timer = setTimeout(() => {
      let start: number | null = null

      const step = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    }, delay)

    return () => clearTimeout(timer)
  }, [target, duration, delay])

  return value
}
