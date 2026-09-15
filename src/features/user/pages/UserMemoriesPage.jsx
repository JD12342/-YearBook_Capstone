import { useEffect, useMemo, useState } from 'react'
import { Camera, Download, Images, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'

const batchLabel = (memory) => memory.schoolYearName || memory.batch || 'School memories'
const cardTilts = ['-3deg', '3deg', '1deg', '2deg', '-1deg', '-2deg', '-2deg', '2deg', '2deg', '-3deg']

const safeFileName = (value) => String(value || 'memory').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
const imageUrl = (image) => typeof image === 'string' ? image : image?.url || image?.imageUrl || image?.downloadUrl || image?.src || ''
const memoryImages = (memory) => {
  const candidates = [
    ...(Array.isArray(memory.images) ? memory.images : []),
    ...(Array.isArray(memory.photos) ? memory.photos : []),
    memory.image,
    memory.imageUrl,
    memory.photoUrl,
  ]

  return candidates
    .map((image) => ({ ...(typeof image === 'object' && image ? image : {}), url: imageUrl(image) }))
    .filter((image, index, images) => image.url && images.findIndex((candidate) => candidate.url === image.url) === index)
}

export function UserMemoriesPage() {
  const { content } = useOutletContext()
  const batches = useMemo(() => {
    const grouped = new Map()
    content.memories.forEach((memory) => {
      const label = batchLabel(memory)
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label).push(memory)
    })
    return [...grouped.entries()]
      .map(([label, memories]) => ({ label, memories: memories.sort((a, b) => String(a.sectionName || '').localeCompare(String(b.sectionName || ''))) }))
      .sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true }))
  }, [content.memories])
  const [activeBatch, setActiveBatch] = useState('')
  const [activePhoto, setActivePhoto] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!batches.length) setActiveBatch('')
    else if (!batches.some((batch) => batch.label === activeBatch)) setActiveBatch(batches[0].label)
  }, [activeBatch, batches])

  useEffect(() => {
    if (!activePhoto) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => { if (event.key === 'Escape') setActivePhoto(null) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activePhoto])

  useScrollReveal('.user-memories-page [data-reveal]')
  const selected = batches.find((batch) => batch.label === activeBatch) || batches[0]
  const galleryPhotos = useMemo(() => selected?.memories.flatMap((memory) => memoryImages(memory).map((image, index) => ({
    ...image,
    key: `${memory.id}-${index}`,
    section: memory.sectionName || memory.title || 'School memory',
    themeColor: memory.themeColor || '#d17c87',
    position: index + 1,
  }))) || [], [selected])
  const featureMemory = selected?.memories?.[0]
  const accentColor = featureMemory?.themeColor || '#d17c87'

  const downloadPhoto = async (photo) => {
    setDownloading(true)
    try {
      const response = await fetch(photo.url)
      if (!response.ok) throw new Error('Download unavailable')
      const blob = await response.blob()
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${safeFileName(selected?.label)}-${safeFileName(photo.section)}-${photo.position}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      const link = document.createElement('a')
      link.href = photo.url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return <div className="user-route-page user-memories-page" style={{ '--memory-accent': accentColor }}>
    <section className="memory-wall-shell">
      <header className="memory-wall-intro" data-reveal>
        <span className="user-eyebrow">THE MEMORY WALL</span>
        <h1>Pinned, dog-eared, kept.</h1>
        <p>A living collage of polaroids from parades, proms, science fairs, and reunions — contributed by batches across the decades.</p>
      </header>

      {batches.length ? <>
        {batches.length > 1 && <nav className="memory-batch-picker" aria-label="Choose a graduating batch">
          {batches.map((batch) => {
            const photoCount = batch.memories.reduce((count, memory) => count + memoryImages(memory).length, 0)
            return <button type="button" key={batch.label} className={batch.label === selected?.label ? 'is-active' : ''} onClick={() => setActiveBatch(batch.label)}><small>BATCH</small><strong>{batch.label}</strong><span>{photoCount} photo{photoCount === 1 ? '' : 's'}</span></button>
          })}
        </nav>}
        {galleryPhotos.length ? <main className="memory-photo-wall" aria-live="polite">
          {galleryPhotos.map((photo, index) => <button type="button" className="memory-wall-card" key={photo.key} onClick={() => setActivePhoto(photo)} aria-label={`Open ${photo.section} memory ${photo.position}`} style={{ '--card-tilt': cardTilts[index % cardTilts.length], '--card-accent': photo.themeColor }}>
            <figure>
              <span className="memory-wall-image"><img src={photo.url} alt={`${photo.section} memory ${photo.position}`} loading={index < 4 ? 'eager' : 'lazy'} /></span>
              <figcaption><strong>{photo.section}</strong><span>{photo.credit || photo.contributor || selected?.label || 'School memories'}</span></figcaption>
            </figure>
          </button>)}
        </main> : <div className="memory-single-missing"><Images size={32} />Pictures unavailable</div>}
      </> : <section className="memory-empty" data-reveal><Images size={39} /><div><strong>The first memories are being gathered.</strong><p>When an administrator publishes pictures for a section, its batch will appear here.</p></div><Camera size={22} /></section>}
    </section>

    {activePhoto && createPortal(<div className="memory-lightbox-portal"><div className="memory-lightbox" role="dialog" aria-modal="true" aria-label={`${activePhoto.section} photo preview`} onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}>
      <div className="memory-lightbox-panel" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}>
        <div className="memory-lightbox-actions">
          <button type="button" onClick={() => downloadPhoto(activePhoto)} disabled={downloading}><Download size={19} />{downloading ? 'Preparing…' : 'Download'}</button>
          <button type="button" className="memory-lightbox-close" onClick={() => setActivePhoto(null)} aria-label="Close photo" autoFocus><X size={24} /></button>
        </div>
        <figure className="memory-lightbox-frame" style={{ '--card-accent': activePhoto.themeColor }}>
          <img src={activePhoto.url} alt={`${activePhoto.section} memory ${activePhoto.position}`} />
          <figcaption><span>{activePhoto.section}</span><small>{selected?.label}</small></figcaption>
        </figure>
      </div>
    </div></div>, document.body)}
  </div>
}
