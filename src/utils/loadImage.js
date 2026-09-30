export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // 이 한 줄을 빼면 PNG 내보내기에서 SecurityError 발생
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
