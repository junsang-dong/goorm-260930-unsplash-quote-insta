import { FONTS } from '../utils/constants'

const ALIGNS = [
  { key: 'left', label: '왼쪽' },
  { key: 'center', label: '가운데' },
  { key: 'right', label: '오른쪽' },
]

const V_ALIGNS = [
  { key: 'top', label: '상단' },
  { key: 'middle', label: '중앙' },
  { key: 'bottom', label: '하단' },
]

const TEXT_COLORS = [
  { key: 'auto', label: '자동', swatch: null },
  { key: '#FFFFFF', label: '흰색', swatch: '#FFFFFF' },
  { key: '#111111', label: '검정', swatch: '#111111' },
]

export default function EditorPanel({ style, onChange }) {
  const set = (patch) => onChange(patch)

  return (
    <div>
      <div className="field">
        <span className="field__label">폰트</span>
        <select
          className="field__control"
          value={style.fontFamily}
          onChange={(e) => set({ fontFamily: e.target.value })}
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field__label">글자 크기 ({style.fontSize}px)</span>
        <div className="slider-row">
          <input
            type="range"
            min={32}
            max={96}
            value={style.fontSize}
            onChange={(e) => set({ fontSize: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label">줄 간격 ({style.lineHeight.toFixed(1)})</span>
        <div className="slider-row">
          <input
            type="range"
            min={1.2}
            max={2.0}
            step={0.1}
            value={style.lineHeight}
            onChange={(e) => set({ lineHeight: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label">정렬</span>
        <div className="segmented">
          {ALIGNS.map((a) => (
            <button key={a.key} type="button" className={style.align === a.key ? 'active' : ''} onClick={() => set({ align: a.key })}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">세로 위치</span>
        <div className="segmented">
          {V_ALIGNS.map((v) => (
            <button key={v.key} type="button" className={style.vAlign === v.key ? 'active' : ''} onClick={() => set({ vAlign: v.key })}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">텍스트 색</span>
        <div className="color-swatches">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`color-swatch ${style.textColor === c.key ? 'active' : ''}`}
              style={{ background: c.swatch || 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)' }}
              onClick={() => set({ textColor: c.key })}
              aria-label={c.label}
              title={c.label}
            />
          ))}
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(style.textColor) ? style.textColor : '#ffffff'}
            onChange={(e) => set({ textColor: e.target.value })}
            title="직접 선택"
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label">오버레이</span>
        <div className="segmented">
          <button type="button" className={style.overlayMode === 'auto' ? 'active' : ''} onClick={() => set({ overlayMode: 'auto' })}>
            자동
          </button>
          <button type="button" className={style.overlayMode === 'manual' ? 'active' : ''} onClick={() => set({ overlayMode: 'manual' })}>
            수동
          </button>
        </div>
        {style.overlayMode === 'manual' && (
          <div className="slider-row" style={{ marginTop: 8 }}>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={style.overlayOpacity}
              onChange={(e) => set({ overlayOpacity: Number(e.target.value) })}
            />
            <span className="slider-row__value">{Math.round(style.overlayOpacity * 100)}%</span>
          </div>
        )}
      </div>

      <div className="field">
        <span className="field__label">오버레이 스타일</span>
        <div className="segmented">
          <button type="button" className={style.overlayType === 'solid' ? 'active' : ''} onClick={() => set({ overlayType: 'solid' })}>
            단색
          </button>
          <button type="button" className={style.overlayType === 'gradient' ? 'active' : ''} onClick={() => set({ overlayType: 'gradient' })}>
            그라디언트
          </button>
        </div>
      </div>

      <div className="toggle-row">
        <span>저자 표시</span>
        <input type="checkbox" checked={style.showAuthor} onChange={(e) => set({ showAuthor: e.target.checked })} />
      </div>
      <div className="toggle-row">
        <span>사진 크레딧</span>
        <input type="checkbox" checked={style.showCredit} onChange={(e) => set({ showCredit: e.target.checked })} />
      </div>

      <div className="field">
        <span className="field__label">사진 위치 (가로)</span>
        <div className="slider-row">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={style.offsetX}
            onChange={(e) => set({ offsetX: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="field">
        <span className="field__label">사진 위치 (세로)</span>
        <div className="slider-row">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={style.offsetY}
            onChange={(e) => set({ offsetY: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
