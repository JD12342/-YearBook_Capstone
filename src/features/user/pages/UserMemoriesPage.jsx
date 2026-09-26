import { useEffect, useMemo, useState } from 'react'
import { Camera, Download, Heart, Images, MessageCircle, Send, Share2, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { addMemoryComment, deleteMemoryComment, getMyHeart, subscribeMemoryComments, toggleMemoryReaction } from '../services/memorySocialService.js'

const batchLabel = (memory) => memory.caption || memory.title || memory.schoolYearName || memory.batch || 'School memories'
const cardTilts = ['-3deg', '3deg', '1deg', '2deg', '-1deg', '-2deg', '-2deg', '2deg', '2deg', '-3deg']

const safeFileName = (value) => String(value || 'memory').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
const imageUrl = (image) => typeof image === 'string' ? image : image?.url || image?.imageUrl || image?.downloadUrl || image?.src || ''
const memoryImages = (memory) => {
  const candidates = [
    ...(Array.isArray(memory.media) ? memory.media : []),
    ...(Array.isArray(memory.images) ? memory.images : []),
    ...(Array.isArray(memory.photos) ? memory.photos : []),
    memory.image,
    memory.imageUrl,
    memory.photoUrl,
  ]

  return candidates
    .map((image) => ({ ...(typeof image === 'object' && image ? image : {}), url: imageUrl(image), type: image?.type || (image?.mimeType?.startsWith('video/') ? 'video' : 'image') }))
    .filter((image, index, images) => image.url && images.findIndex((candidate) => candidate.url === image.url) === index)
}

export function UserMemoriesPage() {
  const { content, displayName, user } = useOutletContext()
  const batches = useMemo(() => {
    const grouped = new Map()
    content.memories.forEach((memory) => {
      const label = batchLabel(memory)
      if (!grouped.has(label)) grouped.set(label, [])
      grouped.get(label).push(memory)
    })
    return [...grouped.entries()]
      .map(([label, memories]) => ({ label, memories: memories.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))) }))
      .sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true }))
  }, [content.memories])
  const [activeBatch, setActiveBatch] = useState('')
  const [activePhoto, setActivePhoto] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [hearted, setHearted] = useState({})
  const [heartCounts, setHeartCounts] = useState({})
  const [commentsMemory, setCommentsMemory] = useState(null)

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

  useEffect(() => {
    let active = true
    Promise.all(content.memories.map(async (memory) => [memory.id, await getMyHeart(memory.id, user?.uid).catch(() => false)]))
      .then((entries) => { if (active) setHearted(Object.fromEntries(entries)) })
    setHeartCounts(Object.fromEntries(content.memories.map((memory) => [memory.id, Number(memory.heartCount) || 0])))
    return () => { active = false }
  }, [content.memories, user?.uid])

  useScrollReveal('.user-memories-page [data-reveal]')
  const selected = batches.find((batch) => batch.label === activeBatch) || batches[0]
  const galleryPhotos = useMemo(() => selected?.memories.flatMap((memory) => memoryImages(memory).map((image, index) => ({
    ...image,
    key: `${memory.id}-${index}`,
    section: memory.title || memory.caption || memory.sectionName || 'School memory',
    themeColor: memory.themeColor || '#d17c87',
    position: index + 1,
    memoryId: memory.id,
    memory,
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

  const toggleHeart = async (memory) => {
    const before = Boolean(hearted[memory.id])
    setHearted((current) => ({ ...current, [memory.id]: !before }))
    setHeartCounts((current) => ({ ...current, [memory.id]: Math.max((current[memory.id] || 0) + (before ? -1 : 1), 0) }))
    try {
      const result = await toggleMemoryReaction(memory.id)
      setHearted((current) => ({ ...current, [memory.id]: result.hearted }))
      setHeartCounts((current) => ({ ...current, [memory.id]: result.heartCount }))
    } catch {
      setHearted((current) => ({ ...current, [memory.id]: before }))
      setHeartCounts((current) => ({ ...current, [memory.id]: Math.max((current[memory.id] || 0) + (before ? 1 : -1), 0) }))
    }
  }

  const shareMemory = async (memory) => {
    const shareData = { title: memory.title || 'GradBook memory', text: memory.caption || 'A memory from Sorsogon National High School', url: window.location.href }
    if (navigator.share) await navigator.share(shareData).catch(() => {})
    else await navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`).catch(() => {})
  }

  return <div className="user-route-page user-memories-page" style={{ '--memory-accent': accentColor }}>
    <section className="memory-wall-shell">
      <header className="memory-wall-intro" data-reveal>
        <span className="user-eyebrow">THE MEMORY WALL</span>
        <h1>Pinned, dog-eared, kept.</h1>
        <p>A living collage of polaroids from parades, proms, science fairs, and reunions — contributed by batches across the decades.</p>
      </header>

      {batches.length ? <>
        {batches.length > 1 && <nav className="memory-batch-picker" aria-label="Choose a memory gallery">
          {batches.map((batch) => {
            const photoCount = batch.memories.reduce((count, memory) => count + memoryImages(memory).length, 0)
            return <button type="button" key={batch.label} className={batch.label === selected?.label ? 'is-active' : ''} onClick={() => setActiveBatch(batch.label)}><small>GALLERY</small><strong>{batch.label}</strong><span>{photoCount} photo{photoCount === 1 ? '' : 's'}</span></button>
          })}
        </nav>}
        {galleryPhotos.length ? <main className="memory-photo-wall" aria-live="polite">
          {galleryPhotos.map((photo, index) => <article className="memory-wall-post" key={photo.key}>
            <button type="button" className="memory-wall-card" onClick={() => setActivePhoto(photo)} aria-label={`Open ${photo.section} memory ${photo.position}`} style={{ '--card-tilt': cardTilts[index % cardTilts.length], '--card-accent': photo.themeColor }}>
              <figure>
                <span className="memory-wall-image">{photo.type === 'video' ? <video src={photo.url} muted playsInline preload="metadata" /> : <img src={photo.url} alt={`${photo.section} memory ${photo.position}`} loading={index < 4 ? 'eager' : 'lazy'} />}</span>
                <figcaption><strong>{photo.section}</strong><span>{photo.credit || photo.contributor || selected?.label || 'School memories'}</span></figcaption>
              </figure>
            </button>
            <div className="memory-social-bar"><button type="button" className={hearted[photo.memoryId] ? 'is-hearted' : ''} onClick={() => toggleHeart(photo.memory)} aria-label="Heart this memory"><Heart size={18} fill={hearted[photo.memoryId] ? 'currentColor' : 'none'} /><span>{heartCounts[photo.memoryId] || 0}</span></button><button type="button" onClick={() => setCommentsMemory(photo.memory)}><MessageCircle size={18} /><span>Comment</span></button><button type="button" onClick={() => shareMemory(photo.memory)}><Share2 size={18} /><span>Share</span></button></div>
          </article>)}
        </main> : <div className="memory-single-missing"><Images size={32} />Pictures unavailable</div>}
      </> : <section className="memory-empty" data-reveal><Images size={39} /><div><strong>The first memories are being gathered.</strong><p>When an administrator publishes a captioned gallery, it will appear here.</p></div><Camera size={22} /></section>}
    </section>

    {activePhoto && createPortal(<div className="memory-lightbox-portal"><div className="memory-lightbox" role="dialog" aria-modal="true" aria-label={`${activePhoto.section} photo preview`} onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}>
      <div className="memory-lightbox-panel" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePhoto(null) }}>
        <div className="memory-lightbox-actions">
          <button type="button" onClick={() => downloadPhoto(activePhoto)} disabled={downloading}><Download size={19} />{downloading ? 'Preparing…' : 'Download'}</button>
          <button type="button" className="memory-lightbox-close" onClick={() => setActivePhoto(null)} aria-label="Close photo" autoFocus><X size={24} /></button>
        </div>
        <figure className="memory-lightbox-frame" style={{ '--card-accent': activePhoto.themeColor }}>
          {activePhoto.type === 'video' ? <video src={activePhoto.url} controls autoPlay playsInline /> : <img src={activePhoto.url} alt={`${activePhoto.section} memory ${activePhoto.position}`} />}
          <figcaption><span>{activePhoto.section}</span><small>{selected?.label}</small></figcaption>
        </figure>
      </div>
    </div></div>, document.body)}
    {commentsMemory && <MemoryCommentsPanel memory={commentsMemory} uid={user?.uid} displayName={displayName} onClose={() => setCommentsMemory(null)} />}
  </div>
}

function MemoryCommentsPanel({ memory, uid, displayName, onClose }) {
  const [comments, setComments] = useState([])
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => subscribeMemoryComments(memory.id, setComments, () => setError('Comments are unavailable right now.')), [memory.id])
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); try { await addMemoryComment(memory.id, { uid, authorName: displayName, text: value }); setValue('') } catch (submitError) { setError(submitError.message) } finally { setSaving(false) } }
  return createPortal(<div className="memory-comments-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="memory-comments-panel" role="dialog" aria-modal="true" aria-label="Memory comments"><header><div><small>MEMORY CONVERSATION</small><h2>{memory.title || 'School memory'}</h2></div><button type="button" onClick={onClose} aria-label="Close comments"><X size={21} /></button></header><div className="memory-comment-list">{comments.length ? comments.map((comment) => <article key={comment.id}><span>{String(comment.authorName || 'G').slice(0, 1).toUpperCase()}</span><div><strong>{comment.authorName || 'GradBook member'}</strong><p>{comment.text}</p></div>{comment.ownerUid === uid && <button type="button" onClick={() => deleteMemoryComment(memory.id, comment.id)} aria-label="Delete comment"><Trash2 size={14} /></button>}</article>) : <div className="memory-comments-empty">Be the first to leave a thoughtful comment.</div>}</div>{error && <div className="memory-comments-error">{error}</div>}<form onSubmit={submit}><input value={value} onChange={(event) => setValue(event.target.value)} maxLength={500} placeholder="Add a comment…" aria-label="Comment" /><button type="submit" disabled={saving || !value.trim()}><Send size={17} /><span>{saving ? 'Sending…' : 'Post'}</span></button></form></section></div>, document.body)
}
