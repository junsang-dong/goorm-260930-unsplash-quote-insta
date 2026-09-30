export function normalizePhoto(raw) {
  return {
    id: raw.id,
    width: raw.width,
    height: raw.height,
    color: raw.color,
    altDescription: raw.alt_description,
    smallUrl: raw.urls.small,
    thumbUrl: raw.urls.thumb,
    rawUrl: raw.urls.raw,
    compositeUrl: `${raw.urls.raw}&w=2160&fit=max&q=85&fm=jpg`,
    htmlUrl: raw.links.html,
    downloadLocation: raw.links.download_location,
    authorName: raw.user.name,
    authorUsername: raw.user.username,
  }
}
