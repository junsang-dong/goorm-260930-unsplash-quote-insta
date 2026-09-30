import { useState } from 'react'

const MAX_PRESETS = 10

export default function PresetManager({ presets, currentStyle, onApply, onSave, onDelete }) {
  const [name, setName] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || presets.length >= MAX_PRESETS) return
    onSave(name.trim(), currentStyle)
    setName('')
  }

  return (
    <div className="preset-manager">
      <span className="field__label">프리셋</span>
      <div className="preset-list">
        {presets.map((p) => (
          <div key={p.id} className="preset-item">
            <span onClick={() => onApply(p.style)} style={{ cursor: 'pointer', flex: 1 }}>
              {p.name}
            </span>
            {!p.id.startsWith('preset-') && <button onClick={() => onDelete(p.id)}>삭제</button>}
          </div>
        ))}
      </div>
      <form className="custom-quote-form" onSubmit={submit} style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="새 프리셋 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={presets.length >= MAX_PRESETS}
        />
        <button type="submit" className="btn" disabled={presets.length >= MAX_PRESETS}>
          현재 스타일 저장
        </button>
      </form>
    </div>
  )
}
