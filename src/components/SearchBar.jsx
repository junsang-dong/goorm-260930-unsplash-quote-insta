import { useState } from 'react'
import { resolveQuery } from '../data/moods'

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onSearch(resolveQuery(value), null)
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <input
        type="text"
        placeholder="키워드 직접 입력 (영문 권장)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">🔍 검색</button>
    </form>
  )
}
