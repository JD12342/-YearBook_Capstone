import { useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, LibraryBig, ScanFace } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ThreeShelfCarousel } from './ThreeShelfCarousel.jsx'

export function UserYearbookShelf({ yearbooks, onFaceSearch }) {
  const navigate = useNavigate()
  const books = useMemo(() => yearbooks.map((book, index) => ({ ...book, title: book.title || `Yearbook ${index + 1}` })), [yearbooks])
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState('SHELF')
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const gesture = useRef(null)
  const wheelTime = useRef(0)
  const activeIndex = Math.min(selected, Math.max(0, books.length - 1))
  const active = books[activeIndex]
  const settle = () => { locked.current = false; setBusy(false) }
  const select = index => {
    if (locked.current || index < 0 || index >= books.length || (index === activeIndex && mode === 'COVER_VIEW')) return
    locked.current = true; setBusy(true)
    setSelected(index); setMode('COVER_VIEW')
  }
  const open = () => {
    if (locked.current || !active) return
    if (mode === 'SHELF') { select(activeIndex); return }
    locked.current = true; setBusy(true)
    navigate(`/community/yearbooks/${active.id}`, { state: { openRequested: true } })
  }
  return <section className="user-yearbook-section reference-shelf" id="yearbooks">
    <header className="reference-shelf-toolbar">
      <div><span className="user-eyebrow">THE YEARBOOK COLLECTION</span><h2>Your years. Your stories.</h2></div>
      <button className="yearbook-face-search-trigger" type="button" onClick={onFaceSearch}><ScanFace size={18} /><strong>Face Search</strong></button>
    </header>
    {active ? <div className="reference-shelf-room" data-interaction-state={mode} aria-busy={busy}
      onKeyDown={e => {
        if (e.target.tagName === 'SELECT') return
        if (e.key === 'ArrowLeft') { e.preventDefault(); select(activeIndex - 1) }
        if (e.key === 'ArrowRight') { e.preventDefault(); select(activeIndex + 1) }
      }}
      onPointerDown={e => { if (e.button === 0) gesture.current = { x: e.clientX, y: e.clientY } }}
      onPointerCancel={() => { gesture.current = null }}
      onPointerUp={e => {
        const start = gesture.current; gesture.current = null
        if (!start) return
        const dx = e.clientX - start.x, dy = e.clientY - start.y
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) select(activeIndex + (dx < 0 ? 1 : -1))
      }}
      onWheel={e => {
        const delta = Math.abs(e.deltaX) > 20 ? e.deltaX : e.shiftKey ? e.deltaY : 0
        if (Math.abs(delta) > 20 && performance.now() - wheelTime.current > 950) {
          wheelTime.current = performance.now(); select(activeIndex + Math.sign(delta))
        }
      }}>
      <ThreeShelfCarousel yearbooks={books} activeIndex={activeIndex} mode={mode} locked={busy} onSelect={select} onOpen={open} onSettled={settle} />
      <button className="reference-shelf-arrow previous" aria-label="Previous yearbook" disabled={busy || activeIndex === 0} onClick={() => select(activeIndex - 1)}><ChevronLeft /></button>
      <button className="reference-shelf-arrow next" aria-label="Next yearbook" disabled={busy || activeIndex === books.length - 1} onClick={() => select(activeIndex + 1)}><ChevronRight /></button>
      <footer className="reference-shelf-controls">
        <div className="reference-shelf-caption" aria-live="polite"><span>{activeIndex + 1} / {books.length}</span><h3>{active.title}</h3><p>{active.schoolYearName}</p></div>
        <div className="reference-shelf-actions">
          <select aria-label="Select a yearbook" value={activeIndex} disabled={busy} onChange={e => select(Number(e.target.value))}>{books.map((book,index) => <option key={book.id || index} value={index}>{book.title}</option>)}</select>
          <button type="button" disabled={busy} onClick={open}><BookOpen size={18} />{busy ? 'Moving yearbook…' : mode === 'SHELF' ? 'View front cover' : 'Open yearbook'}</button>
        </div>
        <p className="reference-shelf-hint">{busy ? 'Bringing your book forward…' : mode === 'SHELF' ? 'Choose a spine to see its cover.' : 'Choose another spine to browse · Click the front cover to open'}</p>
      </footer>
    </div> : <div className="user-yearbook-empty"><LibraryBig /><p>No active yearbooks yet.</p></div>}
  </section>
}
