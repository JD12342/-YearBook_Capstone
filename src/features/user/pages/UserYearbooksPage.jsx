import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserYearbookShelf } from '../components/UserYearbookShelf.jsx'
import { UserFaceSearchPage } from './UserFaceSearchPage.jsx'

export function UserYearbooksPage() {
  const { content } = useOutletContext()
  const [isFaceSearchOpen, setIsFaceSearchOpen] = useState(false)
  useScrollReveal('.user-route-yearbooks [data-reveal]')

  useEffect(() => {
    if (!isFaceSearchOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => { if (event.key === 'Escape') setIsFaceSearchOpen(false) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFaceSearchOpen])

  return (
    <div className="user-route-page user-route-yearbooks">
      <UserYearbookShelf yearbooks={content.yearbooks} onFaceSearch={() => setIsFaceSearchOpen(true)} />
      {isFaceSearchOpen && <div className="yearbook-face-search-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFaceSearchOpen(false) }}>
        <section className="yearbook-face-search-dialog" role="dialog" aria-modal="true" aria-label="Search the yearbook archive">
          <button className="yearbook-face-search-close" type="button" aria-label="Close face search" onClick={() => setIsFaceSearchOpen(false)}><X size={24} /></button>
          <UserFaceSearchPage embedded />
        </section>
      </div>}
    </div>
  )
}
