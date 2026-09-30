const BASE = 'https://api.unsplash.com'
const cache = new Map()
let rateLimit = { limit: null, remaining: null }

export const getRateLimit = () => rateLimit

class UnsplashError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'UnsplashError'
    this.status = status
  }
}

async function request(path, params, accessKey) {
  if (!accessKey) {
    throw new UnsplashError('Unsplash Access Key가 설정되지 않았습니다.', 401)
  }

  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && url.searchParams.set(k, v))

  const cacheKey = url.toString()
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  let res
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })
  } catch {
    throw new UnsplashError('네트워크 오류가 발생했습니다.', 0)
  }

  const limit = res.headers.get('X-Ratelimit-Limit')
  const remaining = res.headers.get('X-Ratelimit-Remaining')
  if (limit != null) {
    rateLimit = { limit: Number(limit), remaining: Number(remaining) }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new UnsplashError(body.errors?.join(', ') || res.statusText, res.status)
    throw err
  }

  const data = await res.json()
  cache.set(cacheKey, data)
  return data
}

export const searchPhotos = (accessKey, { query, page = 1, orientation, color, contentFilter = 'high' }) =>
  request(
    '/search/photos',
    { query, page, per_page: 30, orientation, color, content_filter: contentFilter, order_by: 'relevant' },
    accessKey
  )

export const randomPhotos = (accessKey, { query, orientation, contentFilter = 'high', count = 10 }) =>
  request('/photos/random', { query, orientation, content_filter: contentFilter, count }, accessKey)

// 다운로드 트래킹: 캐시하지 않고 매번 호출
export async function trackDownload(accessKey, photo) {
  const url = photo.downloadLocation || `${BASE}/photos/${photo.id}/download`
  try {
    await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
    })
  } catch (e) {
    console.warn('[unsplash] download tracking failed', e)
  }
}

export function clearCache() {
  cache.clear()
}
