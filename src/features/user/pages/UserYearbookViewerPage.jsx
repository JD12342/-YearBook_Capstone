import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Pause, Play, X } from 'lucide-react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { loadActiveYearbook } from '../services/userPortalService.js'
import { ThreeYearbook } from '../components/ThreeYearbook.jsx'
import { getYearbookPresentation } from '../../yearbook/data/yearbookDefaults.js'

export function UserYearbookViewerPage() {
  const { yearbookId } = useParams()
  const navigate = useNavigate()
  const { content, contentReady } = useOutletContext()
  const [remoteYearbook, setRemoteYearbook] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [isTurning, setIsTurning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const exitTimersRef = useRef([])
  const exitInProgressRef = useRef(false)

  const yearbook = useMemo(() => (
    content.yearbooks.find((record) => record.id === yearbookId)
    || remoteYearbook
  ), [content.yearbooks, remoteYearbook, yearbookId])

  useEffect(() => {
    if (!contentReady || yearbook) return undefined
    let active = true
    setLoading(true)
    loadActiveYearbook(yearbookId)
      .then((record) => { if (active) setRemoteYearbook(record) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [contentReady, yearbook, yearbookId])

  const presentation = useMemo(() => getYearbookPresentation(yearbook || {}, yearbook?.schoolYearName), [yearbook])

  const exitViewer = useCallback(() => {
    if (exitInProgressRef.current) return
    exitInProgressRef.current = true

    audioRef.current?.pause()
    setIsPlaying(false)

    if (!isOpen) {
      navigate('/community/yearbooks')
      return
    }

    setIsExiting(true)
    setIsTurning(false)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rewindInterval = reduceMotion ? 0 : 900
    for (let step = 1; step <= pageIndex; step += 1) {
      const timer = window.setTimeout(() => {
        setPageIndex(pageIndex - step)
      }, (step - 1) * rewindInterval)
      exitTimersRef.current.push(timer)
    }

    const closeAt = (pageIndex * rewindInterval) + (reduceMotion ? 0 : 100)
    const closeTimer = window.setTimeout(() => setIsOpen(false), closeAt)
    const leaveTimer = window.setTimeout(
      () => navigate('/community/yearbooks'),
      closeAt + (reduceMotion ? 80 : 2200),
    )
    exitTimersRef.current.push(closeTimer, leaveTimer)
  }, [isOpen, navigate, pageIndex])

  useEffect(() => {
    const exitOnEscape = (event) => {
      if (event.key === 'Escape') exitViewer()
    }
    window.addEventListener('keydown', exitOnEscape)
    return () => {
      window.removeEventListener('keydown', exitOnEscape)
    }
  }, [exitViewer])

  useEffect(() => () => {
    exitTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    exitTimersRef.current = []
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [presentation.graduationSongUrl])

  const openBook = () => {
    if (isExiting) return
    setIsOpen(true)
    if (presentation.graduationSongUrl && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const changePage = (direction) => {
    if (isTurning || isExiting) return
    const nextIndex = pageIndex + direction
    if (nextIndex < 0 || nextIndex >= presentation.pages.length) return
    setIsTurning(true)
    setPageIndex(nextIndex)
    window.setTimeout(() => setIsTurning(false), 900)
  }

  const toggleSong = () => {
    if (!audioRef.current || !presentation.graduationSongUrl) return
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  if ((loading || !contentReady) && !yearbook) {
    return <div className="yearbook-viewer-message">Preparing the yearbook room…</div>
  }

  if (!yearbook) {
    return (
      <div className="yearbook-viewer-message">
        <BookOpen size={32} />
        <h1>This yearbook is not active.</h1>
        <p>Only yearbooks marked Active by an administrator can be opened here.</p>
        <Link to="/community/yearbooks">Return to the yearbook room</Link>
      </div>
    )
  }

  return (
    <div
      className={`yearbook-viewer ${isOpen ? 'is-open' : ''} ${isExiting ? 'is-exiting' : ''}`}
      style={{
        '--book-cover': presentation.coverColor,
        '--book-accent': presentation.accentColor,
        '--book-page': presentation.pageColor,
        '--book-ink': presentation.inkColor,
      }}
    >
      {presentation.graduationSongUrl && (
        <audio ref={audioRef} src={presentation.graduationSongUrl} loop onEnded={() => setIsPlaying(false)} />
      )}

      <button
        type="button"
        className="yearbook-exit"
        onClick={exitViewer}
        disabled={isExiting}
        aria-label={isExiting ? 'Closing yearbook' : 'Exit yearbook'}
      >
        <X size={22} />
      </button>

      <div className="yearbook-viewer-stage">
        <div className="yearbook-stage-glow" aria-hidden="true" />
        <div className="yearbook-book-shell">
          <ThreeYearbook
            presentation={presentation}
            isOpen={isOpen}
            pageIndex={pageIndex}
            onOpen={openBook}
          />
        </div>

        {isOpen && (
          <>
            <button
              type="button"
              className="yearbook-page-arrow yearbook-page-arrow-previous"
              onClick={() => changePage(-1)}
              disabled={pageIndex === 0 || isTurning || isExiting}
              aria-label="Previous pages"
            >
              <ArrowLeft size={21} />
            </button>
            <button
              type="button"
              className="yearbook-page-arrow yearbook-page-arrow-next"
              onClick={() => changePage(1)}
              disabled={pageIndex === presentation.pages.length - 1 || isTurning || isExiting}
              aria-label="Next pages"
            >
              <ArrowRight size={21} />
            </button>

            <span className="yearbook-page-position">{pageIndex + 1} / {presentation.pages.length}</span>

            {presentation.graduationSongUrl && (
              <button
                type="button"
                className="yearbook-sound-toggle"
                onClick={toggleSong}
                disabled={isExiting}
                title={presentation.graduationSongName || 'Graduation song'}
                aria-label={isPlaying ? 'Pause graduation song' : 'Play graduation song'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
