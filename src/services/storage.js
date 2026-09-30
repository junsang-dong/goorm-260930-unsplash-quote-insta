const PREFIX = 'qcs:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e?.name === 'QuotaExceededError' && key === 'recentCards') {
      const list = load('recentCards', [])
      if (list.length > 0) {
        const trimmed = list.slice(0, -1)
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(trimmed))
          return true
        } catch {
          // fall through
        }
      }
    }
    console.warn('[storage] save failed', key, e)
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch (e) {
    console.warn('[storage] remove failed', key, e)
  }
}

export function exportAll(keys) {
  const data = {}
  for (const key of keys) {
    data[key] = load(key, null)
  }
  return data
}

export function importAll(data) {
  for (const [key, value] of Object.entries(data)) {
    if (value != null) save(key, value)
  }
}

export function clearAll(keys) {
  for (const key of keys) remove(key)
}
