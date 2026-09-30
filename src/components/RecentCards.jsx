export default function RecentCards({ cards, onRestore }) {
  if (cards.length === 0) return null

  return (
    <div className="recent-bar">
      <span className="recent-bar__label">최근 작업</span>
      {cards.map((card) => (
        <div key={card.id} className="recent-thumb" onClick={() => onRestore(card)} title={card.quote.text}>
          <img src={card.photo.thumbUrl} alt="" />
        </div>
      ))}
    </div>
  )
}
