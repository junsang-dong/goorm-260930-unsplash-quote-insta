export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function autoStyle(hex) {
  const L = luminance(hex)
  if (L < 0.18) return { text: '#FFFFFF', overlay: '0,0,0', opacity: 0.2 }
  if (L < 0.5) return { text: '#FFFFFF', overlay: '0,0,0', opacity: 0.35 + (L - 0.18) * 0.47 }
  return { text: '#111111', overlay: '255,255,255', opacity: 0.25 + (L - 0.5) * 0.3 }
}
