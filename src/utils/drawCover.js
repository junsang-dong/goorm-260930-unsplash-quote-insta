export function drawCover(ctx, img, W, H, offsetX = 0, offsetY = 0) {
  const scale = Math.max(W / img.width, H / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  const maxX = (dw - W) / 2
  const maxY = (dh - H) / 2
  const dx = -maxX + offsetX * maxX // offset: -1(왼쪽 끝) ~ 1(오른쪽 끝)
  const dy = -maxY + offsetY * maxY
  ctx.drawImage(img, dx, dy, dw, dh)
}
