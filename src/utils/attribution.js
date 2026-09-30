export function withUtm(url, appName) {
  const u = new URL(url)
  u.searchParams.set('utm_source', appName)
  u.searchParams.set('utm_medium', 'referral')
  return u.toString()
}

export const authorLink = (photo, appName) => withUtm(`https://unsplash.com/@${photo.authorUsername}`, appName)

export const photoLink = (photo, appName) => withUtm(photo.htmlUrl, appName)

export const unsplashLink = (appName) => withUtm('https://unsplash.com/', appName)
