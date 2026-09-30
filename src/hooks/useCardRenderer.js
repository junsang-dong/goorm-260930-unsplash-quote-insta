import { useEffect, useRef, useState } from 'react'
import { loadImage } from '../utils/loadImage'
import { renderCard } from '../utils/renderCard'
import { RATIOS } from '../utils/constants'

export function useCardRenderer({ canvasRef, photo, quote, style, ratio }) {
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const imgCacheRef = useRef({ url: null, img: null })

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas || !photo || !quote) return

    const { w: W, h: H } = RATIOS[ratio]
    canvas.width = W
    canvas.height = H

    async function draw() {
      setStatus('loading')
      try {
        let img = imgCacheRef.current.url === photo.compositeUrl ? imgCacheRef.current.img : null
        if (!img) {
          img = await loadImage(photo.compositeUrl)
          imgCacheRef.current = { url: photo.compositeUrl, img }
        }
        if (cancelled) return

        await document.fonts.load(`${style.fontSize}px "${style.fontFamily}"`)
        if (cancelled) return

        const ctx = canvas.getContext('2d')
        renderCard(ctx, { img, photo, quote, style, ratio })
        setStatus('ready')
      } catch (e) {
        if (!cancelled) {
          console.warn('[useCardRenderer] render failed', e)
          setStatus('error')
        }
      }
    }

    draw()
    return () => {
      cancelled = true
    }
  }, [canvasRef, photo, quote, style, ratio])

  return { status }
}
