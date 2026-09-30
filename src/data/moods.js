export const MOODS = [
  { key: 'calm', label: '평온', query: 'calm nature minimal', tag: 'peace' },
  { key: 'challenge', label: '도전', query: 'mountain summit climbing', tag: 'challenge' },
  { key: 'dawn', label: '새벽', query: 'dawn sunrise mist', tag: 'beginning' },
  { key: 'comfort', label: '위로', query: 'soft light window rain', tag: 'comfort' },
  { key: 'passion', label: '열정', query: 'fire sunset vivid', tag: 'passion' },
  { key: 'solitude', label: '고독', query: 'lonely silhouette fog', tag: 'solitude' },
  { key: 'growth', label: '성장', query: 'sprout plant growth', tag: 'growth' },
  { key: 'journey', label: '여행', query: 'road trip landscape', tag: 'journey' },
  { key: 'focus', label: '집중', query: 'desk workspace minimal', tag: 'focus' },
  { key: 'ocean', label: '바다', query: 'ocean waves horizon', tag: 'freedom' },
  { key: 'night', label: '밤', query: 'night city lights stars', tag: 'reflection' },
  { key: 'season', label: '계절', query: 'autumn leaves', tag: 'change' },
]

const KOREAN_TO_QUERY = MOODS.reduce((acc, m) => {
  acc[m.label] = m.query
  return acc
}, {})

export function resolveQuery(input) {
  const trimmed = input.trim()
  return KOREAN_TO_QUERY[trimmed] || trimmed
}
