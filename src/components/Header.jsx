export default function Header({ rateLimit, onOpenSettings }) {
  const hasLimit = rateLimit.limit != null
  const low = hasLimit && rateLimit.remaining <= 5

  return (
    <header className="header">
      <div className="header__logo">Quote Card Studio</div>
      <div className="header__right">
        {hasLimit && (
          <span className={`badge ${low ? 'badge--warn' : ''}`}>
            API {rateLimit.remaining}/{rateLimit.limit}
          </span>
        )}
        <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="설정">
          ⚙ 설정
        </button>
      </div>
    </header>
  )
}
