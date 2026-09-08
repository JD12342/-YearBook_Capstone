import { Landmark, UsersRound } from 'lucide-react'
import { schoolStoryContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

const noteIcons = { heritage: Landmark, people: UsersRound }

export function SchoolStorySection() {
  return (
    <section className="editorial-page editorial-page-opening" data-reveal>
      <div className="editorial-page-heading">
        <span className="editorial-kicker">{schoolStoryContent.kicker}</span>
        <h2>{schoolStoryContent.title}<br />{schoolStoryContent.titleLine}</h2>
        <EditorialLink>DISCOVER MORE</EditorialLink>
      </div>
      <div className="editorial-feature-photo" role="img" aria-label="A closer view of the SNHS campus"><span>PAST & PRESENT</span></div>
      <div className="editorial-page-notes">
        {schoolStoryContent.notes.map((note) => {
          const Icon = noteIcons[note.icon]
          return <article key={note.title}><Icon size={19} /><b>{note.title}</b><p>{note.body}</p></article>
        })}
      </div>
    </section>
  )
}
