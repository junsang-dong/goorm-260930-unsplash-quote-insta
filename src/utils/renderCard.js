import { autoStyle } from './color'
import { drawCover } from './drawCover'
import { wrapText } from './wrapText'
import {
  RATIOS,
  MARGIN_X_RATIO,
  AUTHOR_SIZE_RATIO,
  AUTHOR_GAP_RATIO,
  CREDIT_SIZE,
  CREDIT_OPACITY,
  CREDIT_MARGIN,
} from './constants'

function resolveStyle(photoColor, style) {
  const auto = autoStyle(photoColor || '#888888')
  const text = style.textColor === 'auto' ? auto.text : style.textColor
  const overlay =
    style.overlayMode === 'auto'
      ? { rgb: auto.overlay, opacity: auto.opacity }
      : { rgb: text === '#FFFFFF' ? '0,0,0' : '255,255,255', opacity: style.overlayOpacity }
  return { text, overlay }
}

function drawOverlay(ctx, W, H, overlay, overlayType) {
  const { rgb, opacity } = overlay
  if (overlayType === 'gradient') {
    const grad = ctx.createLinearGradient(0, H, 0, 0)
    grad.addColorStop(0, `rgba(${rgb},${opacity})`)
    grad.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = `rgba(${rgb},${opacity})`
  }
  ctx.fillRect(0, 0, W, H)
}

export function renderCard(ctx, { img, photo, quote, style, ratio }) {
  const { w: W, h: H, marginYRatio } = RATIOS[ratio]
  ctx.clearRect(0, 0, W, H)

  // 1. 배경 사진
  drawCover(ctx, img, W, H, style.offsetX, style.offsetY)

  // 2. 오버레이
  const { text: textColor, overlay } = resolveStyle(photo?.color, style)
  drawOverlay(ctx, W, H, overlay, style.overlayType)

  // 3. 명언 텍스트
  const marginX = W * MARGIN_X_RATIO
  const marginY = H * marginYRatio
  const maxWidth = W - marginX * 2
  const fontSize = style.fontSize
  const lineHeight = fontSize * style.lineHeight

  ctx.textBaseline = 'alphabetic'
  ctx.font = `${fontSize}px "${style.fontFamily}"`
  const lines = wrapText(ctx, quote.text, maxWidth)

  const authorSize = fontSize * AUTHOR_SIZE_RATIO
  const authorGap = fontSize * AUTHOR_GAP_RATIO
  const showAuthor = style.showAuthor && !!quote.author

  const textBlockHeight = lines.length * lineHeight + (showAuthor ? authorGap + authorSize : 0)

  let startY
  if (style.vAlign === 'top') startY = marginY
  else if (style.vAlign === 'bottom') startY = H - marginY - textBlockHeight
  else startY = (H - textBlockHeight) / 2
  startY = Math.max(marginY, startY)

  let x
  if (style.align === 'left') {
    ctx.textAlign = 'left'
    x = marginX
  } else if (style.align === 'right') {
    ctx.textAlign = 'right'
    x = W - marginX
  } else {
    ctx.textAlign = 'center'
    x = W / 2
  }

  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px "${style.fontFamily}"`
  let y = startY + fontSize
  for (const line of lines) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }

  // 4. 저자 표기
  if (showAuthor) {
    ctx.font = `${authorSize}px "${style.fontFamily}"`
    ctx.fillText(`— ${quote.author}`, x, y - lineHeight + authorGap + authorSize)
  }

  // 5. 사진 크레딧
  if (style.showCredit && photo?.authorName) {
    ctx.save()
    ctx.globalAlpha = CREDIT_OPACITY
    ctx.font = `${CREDIT_SIZE}px "Noto Sans KR"`
    ctx.textAlign = 'right'
    ctx.fillStyle = textColor
    ctx.fillText(`Photo by ${photo.authorName} / Unsplash`, W - CREDIT_MARGIN, H - CREDIT_MARGIN)
    ctx.restore()
  }
}
