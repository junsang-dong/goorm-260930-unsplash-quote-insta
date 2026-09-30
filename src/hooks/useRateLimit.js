import { useEffect, useState } from 'react'
import { getRateLimit } from '../services/unsplash'

export function useRateLimit() {
  const [rateLimit, setRateLimit] = useState(getRateLimit())

  useEffect(() => {
    const id = setInterval(() => {
      setRateLimit((prev) => {
        const next = getRateLimit()
        if (next.limit === prev.limit && next.remaining === prev.remaining) return prev
        return next
      })
    }, 800)
    return () => clearInterval(id)
  }, [])

  return rateLimit
}
