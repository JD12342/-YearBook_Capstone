import { livingLegacyContent } from '../../data/landingContent.js'
import { useLandingSection } from '../../hooks/useLandingContent.js'

export function LivingLegacySection() {
  const content = useLandingSection('overview', livingLegacyContent)
  return (
    <section className="editorial-page editorial-page-legend" data-reveal>
      <div className="editorial-portrait-slot" role="img" aria-label="Archive-inspired view of the school"><span>FROM THE ARCHIVE</span></div>
      <div className="editorial-legend-copy">
        <span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}</h2><p>{content.description}</p>
        <div className="editorial-facts">
          {content.facts.map((fact) => <article key={fact.title}><b>{fact.title}</b><p>{fact.body}</p></article>)}
        </div>
      </div>
    </section>
  )
}
