import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Hand, Maximize, Minimize, Pause, Play, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { loadActiveYearbook } from '../services/userPortalService.js'
import { ThreeYearbook } from '../components/ThreeYearbook.jsx'
import { getYearbookPresentation } from '../../yearbook/data/yearbookDefaults.js'

export function UserYearbookViewerPage() {
  const { yearbookId } = useParams()
  const navigate = useNavigate()
  const [yearbook, setYearbook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [textView, setTextView] = useState(false)
  const [notice, setNotice] = useState('')
  const viewerRef = useRef(null), audioRef = useRef(null), gesture = useRef(null), turnTimer = useRef(null), turning = useRef(false)
  const presentation = useMemo(() => getYearbookPresentation(yearbook || {}, yearbook?.schoolYearName), [yearbook])
  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setYearbook(null); setIsOpen(false); setPageIndex(0)
    loadActiveYearbook(yearbookId).then(record => { if (active) setYearbook(record) })
      .catch(() => { if (active) setError('We could not load this edition. Check your connection and try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [yearbookId])
  useEffect(() => {
    const update = () => {
      const isFullscreen = document.fullscreenElement === viewerRef.current
      setFullscreen(isFullscreen)
      if (!isFullscreen && screen.orientation?.unlock) screen.orientation.unlock()
    }
    document.addEventListener('fullscreenchange', update)
    return () => { document.removeEventListener('fullscreenchange', update); window.clearTimeout(turnTimer.current) }
  }, [])
  const exitViewer = useCallback(async () => {
    if (isExiting) return
    audioRef.current?.pause()
    if (document.fullscreenElement === viewerRef.current) await document.exitFullscreen().catch(() => {})
    if (!isOpen || textView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('/community/yearbooks')
      return
    }
    setIsExiting(true)
    turning.current = true
    // Turn every visible leaf back, close the cover, then leave the room.
    for (let step = 1; step <= pageIndex; step += 1) {
      window.setTimeout(() => setPageIndex(current => Math.max(0, current - 1)), (step - 1) * 620)
    }
    const closeAfter = pageIndex * 620 + 680
    window.setTimeout(() => setIsOpen(false), closeAfter)
    // Hardcover deliberately waits before moving, then folds over the stack.
    window.setTimeout(() => navigate('/community/yearbooks'), closeAfter + 1950)
  }, [isExiting, isOpen, navigate, pageIndex, textView])
  const goToPage = useCallback(index => {
    if (turning.current || index < 0 || index >= presentation.pages.length) return
    turning.current = true
    setPageIndex(index)
    turnTimer.current = window.setTimeout(() => { turning.current = false }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900)
  }, [presentation.pages.length])
  useEffect(() => {
    const handleKey = event => {
      if (event.target.closest('input, select, textarea, button')) return
      if (event.key === 'Escape' && !document.fullscreenElement && !fullscreen) exitViewer()
      if (isOpen && event.key === 'PageDown') { event.preventDefault(); goToPage(pageIndex + 1) }
      if (isOpen && event.key === 'PageUp') { event.preventDefault(); goToPage(pageIndex - 1) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [exitViewer, fullscreen, isOpen, goToPage, pageIndex])
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (viewerRef.current?.requestFullscreen) {
        await viewerRef.current.requestFullscreen()
        // Screen Orientation is optional. Browsers that support it rotate the
        // phone for the wider two-page reading layout; others stay fullscreen.
        if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {})
      }
      else setNotice('This browser does not support full screen. The reader already fills the available window.')
    } catch { setNotice('Full screen is unavailable in this browser. You can keep reading here.') }
  }
  const toggleSong = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setNotice('The song could not play. Please try again.'))
    else audio.pause()
  }
  const openBook = () => { if (!isExiting) setIsOpen(true) }
  const startSwipe = event => {
    if (!isOpen || textView || !event.isPrimary || event.button !== 0) return
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const endSwipe = event => {
    const start = gesture.current
    gesture.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) goToPage(pageIndex + (dx < 0 ? 1 : -1))
  }
  if (loading) return <div className="yearbook-viewer-message" role="status">Preparing your yearbook…</div>
  if (error || !yearbook) return <div className="yearbook-viewer-message"><BookOpen size={32} /><h1>{error ? 'Unable to open yearbook' : 'This edition is not available yet'}</h1><p>{error || 'An administrator must save this edition with its school records and mark it Active.'}</p><Link to="/community/yearbooks">Return to the yearbook room</Link></div>
  const page = presentation.pages[pageIndex]
  return <div ref={viewerRef} className={`yearbook-viewer ${isOpen ? 'is-open' : ''} ${isExiting ? 'is-exiting' : ''}`} style={{ '--book-cover': presentation.coverColor, '--book-accent': presentation.accentColor, '--book-page': presentation.pageColor, '--book-ink': presentation.inkColor }}>
    {presentation.graduationSongUrl && <audio ref={audioRef} src={presentation.graduationSongUrl} loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onError={() => setNotice('The graduation song is unavailable.')} />}
    <div className="yearbook-reader-tools" aria-label="Yearbook controls">
      <button type="button" disabled={isExiting} onClick={() => { setTextView(value => !value); setIsOpen(true) }} aria-pressed={textView} aria-label={textView ? 'Show 3D view' : 'Read as text'} title={textView ? 'Show 3D view' : 'Read as text'}><BookOpen size={19} /></button>
      <button type="button" disabled={isExiting} onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>
      {presentation.graduationSongUrl && <button type="button" onClick={toggleSong} aria-label={isPlaying ? 'Pause graduation song' : 'Play graduation song'} title={isPlaying ? 'Pause graduation song' : 'Play graduation song'}>{isPlaying ? <Pause size={19} /> : <Play size={19} />}</button>}
      <button type="button" disabled={isExiting} onClick={exitViewer} aria-label={isExiting ? 'Closing yearbook' : 'Close yearbook'} title="Close yearbook"><X size={21} /></button>
    </div>
    {notice && <div className="yearbook-reader-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    <div className="yearbook-viewer-stage">
      <div className="yearbook-stage-glow" aria-hidden="true" />
      {textView ? <article className="yearbook-readable-page" aria-label={`Spread ${pageIndex + 1}`}>
        <small>{page.eyebrow}</small><h1>{page.title || 'The graduating class'}</h1>
        {page.layout === 'profiles' || page.id === 'portraits' ? <>
          {page.profiles.length ? page.profiles.map(profile => <section className="yearbook-readable-profile" key={profile.id}>
            {profile.photoUrl && <img src={profile.photoUrl} alt={`Portrait of ${profile.name}`} />}
            <div><h2>{profile.name}</h2><p>{[profile.strand, profile.section].filter(Boolean).join(' · ')}</p>{profile.awards && <p>Awards: {profile.awards}</p>}{!profile.photoUrl && <p>Portrait not available</p>}</div>
          </section>) : <p>No student records published yet.</p>}
        </> : <><p>{page.body}</p>{page.quote && <blockquote>{page.quote}</blockquote>}{[page.leftPageImageUrl, page.rightPageImageUrl].filter(Boolean).map((url, i) => <img key={url + i} src={url} alt={`Custom page artwork ${i + 1}`} />)}</>}
      </article> : <div className="yearbook-book-shell" onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null }}>
        <ThreeYearbook presentation={presentation} isOpen={isOpen} pageIndex={pageIndex} onOpen={openBook} />
      </div>}
    </div>
    <div className={`yearbook-reader-hint ${isOpen ? 'is-open' : ''}`}><Hand size={20} aria-hidden="true" /><span>{isOpen ? (textView ? 'Choose a spread to continue' : 'Swipe left or right to turn pages') : 'Tap the cover to open'}</span></div>
    {isOpen && <label className="yearbook-spread-picker"><span className="yearbook-screen-reader-status">Choose spread</span><select aria-label="Choose yearbook spread" value={pageIndex} onChange={event => goToPage(Number(event.target.value))}>{presentation.pages.map((item, index) => <option value={index} key={item.id}>{index + 1} / {presentation.pages.length} — {item.eyebrow || 'Pages'}</option>)}</select></label>}
    <span className="yearbook-screen-reader-status" aria-live="polite">{isOpen ? `Spread ${pageIndex + 1} of ${presentation.pages.length}${pageIndex === presentation.pages.length - 1 ? '. Last spread.' : ''}` : 'Cover'}</span>
  </div>
}
