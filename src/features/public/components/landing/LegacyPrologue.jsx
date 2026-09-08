import { legacyContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

export function LegacyPrologue() {
  return (
    <section className="editorial-prologue" data-reveal>
      <div className="editorial-prologue-copy">
        <span className="editorial-index">{legacyContent.index}</span>
        <span className="editorial-kicker">{legacyContent.kicker}</span>
        <h2>{legacyContent.title}<br />{legacyContent.titleLine} <em>{legacyContent.emphasis}</em></h2>
        <p>{legacyContent.description}</p>
        <EditorialLink>ENTER GRADBOOK</EditorialLink>
      </div>
      <div className="editorial-prologue-photo" role="img" aria-label="Sorsogon National High School campus"><span>THE SNHS CAMPUS</span></div>
    </section>
  )
}
