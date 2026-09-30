import { useCallback, useState } from 'react'
import { load, save } from '../services/storage'

export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback))

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        save(key, resolved)
        return resolved
      })
    },
    [key]
  )

  return [value, update]
}
