import { authorLink } from '../utils/attribution'
import { useSettings } from '../context/SettingsContext'

export default function PhotoCard({ photo, selected, onSelect }) {
  const { settings } = useSettings()

  return (
    <div
      className={`photo-card ${selected ? 'photo-card--selected' : ''}`}
      onClick={() => onSelect(photo)}
    >
      <img src={photo.smallUrl} alt={photo.altDescription || ''} loading="lazy" />
      <div className="photo-card__credit">
        Photo by{' '}
        <a
          href={authorLink(photo, settings.appName)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.authorName}
        </a>{' '}
        on Unsplash
      </div>
    </div>
  )
}
