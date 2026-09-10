import { useEffect, useRef } from 'react'
import { paintYearbookCover, COVER_ART_WIDTH, COVER_ART_HEIGHT } from '../data/coverArtwork.js'
import '../styles/yearbookCover.css'

export function YearbookCover({ presentation, className = '' }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const context = canvasRef.current.getContext('2d')
    let active = true
    const image = new Image()
    image.crossOrigin = 'anonymous'
    paintYearbookCover(context, presentation)
    image.onload = () => { if (active) paintYearbookCover(context, presentation, image) }
    image.src = presentation.coverImageUrl || '/snhs-seal.png'
    return () => { active = false; image.onload = null; image.src = '' }
  }, [presentation])
  return <canvas ref={canvasRef} width={COVER_ART_WIDTH} height={COVER_ART_HEIGHT} className={`shared-yearbook-cover ${className}`} role="img" aria-label={`${presentation.coverTitle} — ${presentation.coverSubtitle || ''}`} />
}
