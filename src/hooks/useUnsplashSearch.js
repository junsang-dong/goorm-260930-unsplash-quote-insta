import { useCallback, useRef, useState } from 'react'
import { searchPhotos } from '../services/unsplash'
import { normalizePhoto } from '../utils/photo'

export function useUnsplashSearch({ accessKey, contentFilter }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [searchId, setSearchId] = useState(0)

  const paramsRef = useRef({ query: '', orientation: undefined, color: undefined, page: 1 })

  const runSearch = useCallback(
    async (page) => {
      const { query, orientation, color } = paramsRef.current
      if (!query) return
      setLoading(true)
      setError(null)
      try {
        const data = await searchPhotos(accessKey, { query, page, orientation, color, contentFilter })
        const photos = data.results.map(normalizePhoto)
        setResults((prev) => (page === 1 ? photos : [...prev, ...photos]))
        setHasMore(page < data.total_pages)
        paramsRef.current.page = page
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    },
    [accessKey, contentFilter]
  )

  const search = useCallback(
    (query, { orientation, color } = {}) => {
      paramsRef.current = { query, orientation, color, page: 1 }
      setSearchId((id) => id + 1)
      runSearch(1)
    },
    [runSearch]
  )

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    runSearch(paramsRef.current.page + 1)
  }, [loading, hasMore, runSearch])

  return { results, loading, error, hasMore, searchId, search, loadMore }
}
