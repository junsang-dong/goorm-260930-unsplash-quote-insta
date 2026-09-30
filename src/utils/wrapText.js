export function wrapText(ctx, text, maxWidth) {
  const lines = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth) {
        line = test
      } else if (!line) {
        // 단어 하나가 너무 긴 경우: 글자 단위로 분할
        let chunk = ''
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth) {
            lines.push(chunk)
            chunk = ch
          } else chunk += ch
        }
        line = chunk
      } else {
        lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}
