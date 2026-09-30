export function getAccessKey(settings) {
  if (settings?.accessKey) return settings.accessKey
  if (import.meta.env.DEV) return import.meta.env.VITE_UNSPLASH_ACCESS_KEY ?? ''
  return ''
}
