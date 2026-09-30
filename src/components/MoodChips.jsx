import { MOODS } from '../data/moods'

export default function MoodChips({ activeKey, onSelect }) {
  return (
    <>
      {MOODS.map((mood) => (
        <button
          key={mood.key}
          type="button"
          className={`chip ${activeKey === mood.key ? 'chip--active' : ''}`}
          onClick={() => onSelect(mood)}
        >
          {mood.label}
        </button>
      ))}
    </>
  )
}
