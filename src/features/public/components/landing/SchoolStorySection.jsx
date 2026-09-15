import { Landmark, UsersRound } from 'lucide-react'
import { schoolStoryContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

const noteIcons = { heritage: Landmark, people: UsersRound }

export function SchoolStorySection() {
  const content = useLandingSection('explore', schoolStoryContent)
  return (
    <section className="editorial-page editorial-page-opening" data-reveal>
      <div className="editorial-page-heading">
        <span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}<br />{content.titleLine}</h2>
        <EditorialLink>{content.ctaLabel || 'DISCOVER MORE'}</EditorialLink>
      </div>
      <div className="editorial-feature-photo" style={content.imageUrl ? { backgroundImage: `url(${content.imageUrl})` } : undefined} role="img" aria-label="A closer view of the SNHS campus"><span>PAST & PRESENT</span></div>
      <div className="editorial-page-notes">
        {content.notes.map((note) => {
          const Icon = noteIcons[note.icon]
          return <article key={note.title}><Icon size={19} /><b>{note.title}</b><p>{note.body}</p></article>
        })}
      </div>
    </section>
  )
}
