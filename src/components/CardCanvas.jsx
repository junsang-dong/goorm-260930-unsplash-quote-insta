import { forwardRef } from 'react'
import { useCardRenderer } from '../hooks/useCardRenderer'

const CardCanvas = forwardRef(function CardCanvas({ photo, quote, style, ratio }, ref) {
  const { status } = useCardRenderer({ canvasRef: ref, photo, quote, style, ratio })

  if (!photo || !quote) {
    return (
      <div className="canvas-placeholder">
        사진과 명언을 선택하면
        <br />
        여기에 미리보기가 표시됩니다.
      </div>
    )
  }

  return (
    <div className="canvas-wrap">
      <canvas ref={ref} />
      {status === 'loading' && <div className="grid-status">렌더링 중…</div>}
    </div>
  )
})

export default CardCanvas
