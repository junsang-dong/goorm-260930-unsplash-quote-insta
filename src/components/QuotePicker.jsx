import { useMemo, useState } from 'react'

const TABS = [
  { key: 'recommended', label: '추천' },
  { key: 'all', label: '전체' },
  { key: 'favorites', label: '즐겨찾기' },
  { key: 'custom', label: '직접 입력' },
]

const LANGS = [
  { key: 'all', label: '전체' },
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
]

export default function QuotePicker({
  quotes,
  customQuotes,
  favorites,
  moodTag,
  selectedId,
  onSelect,
  onToggleFavorite,
  onAddCustom,
}) {
  const [tab, setTab] = useState('recommended')
  const [lang, setLang] = useState('all')
  const [draftText, setDraftText] = useState('')
  const [draftAuthor, setDraftAuthor] = useState('')

  const filtered = useMemo(() => {
    const pool = tab === 'custom' ? [] : [...quotes, ...customQuotes]
    let list = pool
    if (tab === 'recommended' && moodTag) {
      list = list.filter((q) => q.tags?.includes(moodTag))
      if (list.length === 0) list = pool
    }
    if (tab === 'favorites') {
      list = list.filter((q) => favorites.includes(q.id))
    }
    if (lang !== 'all') {
      list = list.filter((q) => q.lang === lang)
    }
    return list
  }, [quotes, customQuotes, tab, moodTag, favorites, lang])

  function submitCustom(e) {
    e.preventDefault()
    if (!draftText.trim()) return
    onAddCustom({ text: draftText.trim(), author: draftAuthor.trim() })
    setDraftText('')
    setDraftAuthor('')
  }

  return (
    <div className="field">
      <span className="field__label">명언 선택</span>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'custom' && (
        <div className="lang-filter">
          {LANGS.map((l) => (
            <button key={l.key} type="button" className={lang === l.key ? 'active' : ''} onClick={() => setLang(l.key)}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'custom' ? (
        <form className="custom-quote-form" onSubmit={submitCustom}>
          <textarea
            rows={3}
            placeholder="명언을 입력하세요"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
          />
          <input
            type="text"
            placeholder="저자 (선택)"
            value={draftAuthor}
            onChange={(e) => setDraftAuthor(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            내 명언으로 저장
          </button>
        </form>
      ) : (
        <div className="quote-list">
          {filtered.length === 0 && <div className="grid-status">해당하는 명언이 없습니다.</div>}
          {filtered.map((q) => (
            <div
              key={q.id}
              className={`quote-item ${selectedId === q.id ? 'quote-item--selected' : ''}`}
              onClick={() => onSelect(q)}
            >
              <span className="quote-item__text">
                {q.text}
                {q.author && <span className="quote-item__author">— {q.author}</span>}
              </span>
              <button
                type="button"
                className={`star-btn ${favorites.includes(q.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(q.id)
                }}
                aria-label="즐겨찾기"
              >
                {favorites.includes(q.id) ? '★' : '☆'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
