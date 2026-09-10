import { useEffect, useMemo } from 'react'
import { ArrowUpRight, BookMarked, LibraryBig, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getYearbookPresentation } from '../../yearbook/data/yearbookDefaults.js'
import { ThreeYearbook } from './ThreeYearbook.jsx'
import { preloadYearbookCoverTexture } from './yearbook3d/yearbookTextures.js'

const normalizeYearbook = (yearbook, index) => ({
  ...yearbook,
  title: yearbook.title || `Published yearbook ${index + 1}`,
  subtitle: yearbook.description || yearbook.schoolYear || yearbook.schoolYearName || 'Published school collection',
  status: yearbook.status === 'active' ? 'Active edition' : yearbook.status || 'Archive edition',
  tone: ['heritage', 'portraits', 'campus'][index % 3],
})

function YearbookShelfModel({ yearbook, onOpen }) {
  const presentation = useMemo(
    () => getYearbookPresentation(yearbook, yearbook.schoolYearName),
    [yearbook],
  )
  useEffect(() => {
    preloadYearbookCoverTexture(presentation)
  }, [presentation])

  return <ThreeYearbook presentation={presentation} isOpen={false} pageIndex={0} onOpen={onOpen} />
}

export function UserYearbookShelf({ yearbooks }) {
  const navigate = useNavigate()
  const visibleYearbooks = yearbooks.map(normalizeYearbook)

  return (
    <section className="user-yearbook-section" id="yearbooks" data-reveal>
      <div className="user-yearbook-heading">
        <div><span className="user-eyebrow">THE YEARBOOK ROOM</span><h2>Open a chapter from the archive.</h2></div>
        <div className="user-readonly-note"><LockKeyhole size={16} /><span>Read-only community view</span></div>
      </div>

      {visibleYearbooks.length ? <div className="user-yearbook-shelf">
        {visibleYearbooks.map((yearbook) => (
          <article
            className={`user-yearbook-card tone-${yearbook.tone || 'heritage'}`}
            key={yearbook.id || yearbook.title}
            style={{ '--shelf-cover': yearbook.coverColor, '--shelf-accent': yearbook.accentColor }}
          >
            <div className="user-yearbook-model-stage">
              <YearbookShelfModel yearbook={yearbook} onOpen={() => navigate(`/community/yearbooks/${yearbook.id}`)} />
            </div>
            <div className="user-yearbook-details">
              <span>{yearbook.status}</span>
              <h3>{yearbook.title}</h3>
              <p>{yearbook.subtitle}</p>
              <Link className="user-yearbook-availability" to={`/community/yearbooks/${yearbook.id}`}><BookMarked size={15} />Open 3D yearbook<ArrowUpRight size={14} /></Link>
            </div>
          </article>
        ))}
      </div> : <div className="user-yearbook-empty"><LibraryBig size={34} /><div><strong>No active yearbooks yet.</strong><p>An edition will appear here only after an administrator creates it and marks it Active.</p></div></div>}
    </section>
  )
}
