import { useState } from 'react'
import { waitForFonts, canvasToBlob, buildFilename, downloadBlob } from '../utils/exportCard'
import { trackDownload } from '../services/unsplash'

const canShareFiles =
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  (() => {
    try {
      return navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] })
    } catch {
      return false
    }
  })()

export default function ExportButtons({ canvasRef, photo, quote, style, ratio, accessKey, onExported }) {
  const [busy, setBusy] = useState(false)
  const disabled = !photo || !quote || busy

  async function prepareBlob() {
    await waitForFonts(style.fontFamily, style.fontSize)
    return canvasToBlob(canvasRef.current)
  }

  async function handleSave() {
    if (disabled) return
    setBusy(true)
    try {
      const blob = await prepareBlob()
      trackDownload(accessKey, photo) // 실패해도 저장은 진행
      downloadBlob(blob, buildFilename(ratio))
      onExported?.()
    } catch (e) {
      console.warn('[ExportButtons] save failed', e)
      alert('PNG 저장에 실패했습니다. 콘솔을 확인해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleShare() {
    if (disabled) return
    setBusy(true)
    try {
      const blob = await prepareBlob()
      const file = new File([blob], buildFilename(ratio), { type: 'image/png' })
      trackDownload(accessKey, photo)
      await navigator.share({ files: [file], title: 'Quote Card Studio' })
      onExported?.()
    } catch (e) {
      if (e?.name !== 'AbortError') console.warn('[ExportButtons] share failed', e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-buttons">
      <button type="button" className="btn btn--primary" disabled={disabled} onClick={handleSave}>
        {busy ? '저장 중…' : 'PNG 저장'}
      </button>
      {canShareFiles && (
        <button type="button" className="btn" disabled={disabled} onClick={handleShare}>
          공유
        </button>
      )}
    </div>
  )
}
