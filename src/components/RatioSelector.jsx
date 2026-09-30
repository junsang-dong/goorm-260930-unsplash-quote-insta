const RATIO_OPTIONS = ['1:1', '4:5', '9:16']

export default function RatioSelector({ value, onChange }) {
  return (
    <div className="field">
      <span className="field__label">출력 비율</span>
      <div className="segmented">
        {RATIO_OPTIONS.map((r) => (
          <button key={r} type="button" className={value === r ? 'active' : ''} onClick={() => onChange(r)}>
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
