import { livingLegacyContent } from '../../data/landingContent.js'

export function LivingLegacySection() {
  return (
    <section className="editorial-page editorial-page-legend" data-reveal>
      <div className="editorial-portrait-slot" role="img" aria-label="Archive-inspired view of the school"><span>FROM THE ARCHIVE</span></div>
      <div className="editorial-legend-copy">
        <span className="editorial-kicker">{livingLegacyContent.kicker}</span>
        <h2>{livingLegacyContent.title}</h2>
        <p>{livingLegacyContent.description}</p>
        <div className="editorial-facts">
          {livingLegacyContent.facts.map((fact) => <article key={fact.title}><b>{fact.title}</b><p>{fact.body}</p></article>)}
        </div>
      </div>
    </section>
  )
}
