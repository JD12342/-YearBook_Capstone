import { BookMarked, LockKeyhole } from 'lucide-react'
import { previewYearbooks } from '../data/userPortalContent.js'

const normalizeYearbook = (yearbook, index) => ({
  ...yearbook,
  title: yearbook.title || `Published yearbook ${index + 1}`,
  subtitle: yearbook.description || yearbook.schoolYear || yearbook.schoolYearName || 'Published school collection',
  status: yearbook.status === 'published' ? 'Published edition' : yearbook.status || 'Archive edition',
  tone: ['heritage', 'portraits', 'campus'][index % 3],
})

export function UserYearbookShelf({ yearbooks, isPreview }) {
  const visibleYearbooks = yearbooks.length ? yearbooks.slice(0, 6).map(normalizeYearbook) : previewYearbooks

  return (
    <section className="user-yearbook-section" id="yearbooks" data-reveal>
      <div className="user-yearbook-heading">
        <div><span className="user-eyebrow">THE YEARBOOK ROOM</span><h2>Open a chapter from the archive.</h2></div>
        <div className="user-readonly-note"><LockKeyhole size={16} /><span>Read-only community view</span></div>
      </div>

      <div className="user-yearbook-shelf">
        {visibleYearbooks.map((yearbook, index) => (
          <article className={`user-yearbook-card tone-${yearbook.tone || 'heritage'}`} key={yearbook.id || yearbook.title}>
            <div className="user-yearbook-cover">
              <span className="user-yearbook-number">{String(index + 1).padStart(2, '0')}</span>
              <img src="/snhs-seal.png" alt="" />
              <div><small>SORSOGON NATIONAL HIGH SCHOOL</small><strong>GRAD<br />BOOK</strong></div>
              <span className="user-yearbook-mark">ARCHIVE</span>
            </div>
            <div className="user-yearbook-details">
              <span>{yearbook.status}</span>
              <h3>{yearbook.title}</h3>
              <p>{yearbook.subtitle}</p>
              <div className="user-yearbook-availability"><BookMarked size={15} />{isPreview && !yearbooks.length ? 'Preview layout' : 'Available to view'}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
