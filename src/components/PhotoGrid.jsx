import { useState } from 'react'
import PhotoCard from './PhotoCard'

const PAGE_SIZE = 12

export default function PhotoGrid({
  results,
  loading,
  error,
  hasMore,
  onLoadMore,
  searchId,
  selectedId,
  onSelect,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [renderedSearchId, setRenderedSearchId] = useState(searchId)

  // 새 검색이 시작되면(searchId 변경) 노출 개수를 12장으로 초기화한다.
  if (searchId !== renderedSearchId) {
    setRenderedSearchId(searchId)
    setVisibleCount(PAGE_SIZE)
  }

  if (error) {
    return <div className="grid-status">사진을 불러오지 못했습니다: {error.message}</div>
  }

  if (!loading && results.length === 0) {
    return <div className="grid-status">분위기 키워드를 선택하거나 검색해 보세요.</div>
  }

  const visible = results.slice(0, visibleCount)
  const canShowMore = visibleCount < results.length || hasMore

  function handleShowMore() {
    const next = visibleCount + PAGE_SIZE
    setVisibleCount(next)
    if (next >= results.length && hasMore && !loading) {
      onLoadMore()
    }
  }

  return (
    <div>
      <div className="photo-grid">
        {visible.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} selected={photo.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      {loading && <div className="grid-status">불러오는 중…</div>}
      {!loading && canShowMore && (
        <button type="button" className="btn grid-load-more" onClick={handleShowMore}>
          이미지 더 보기
        </button>
      )}
    </div>
  )
}
