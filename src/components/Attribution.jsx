import { authorLink, unsplashLink } from '../utils/attribution'
import { useSettings } from '../context/SettingsContext'

export default function Attribution({ photo }) {
  const { settings } = useSettings()
  if (!photo) return null

  return (
    <div className="attribution">
      Photo by{' '}
      <a href={authorLink(photo, settings.appName)} target="_blank" rel="noopener noreferrer">
        {photo.authorName}
      </a>{' '}
      on{' '}
      <a href={unsplashLink(settings.appName)} target="_blank" rel="noopener noreferrer">
        Unsplash
      </a>
    </div>
  )
}
