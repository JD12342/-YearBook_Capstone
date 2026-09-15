import { legacyContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

export function LegacyPrologue() {
  const content = useLandingSection('legacy', legacyContent)
  return (
    <section className="editorial-prologue" data-reveal>
      <div className="editorial-prologue-copy">
        <span className="editorial-index">{content.index}</span><span className="editorial-kicker">{content.eyebrow || content.kicker}</span>
        <h2>{content.title}<br />{content.titleLine} <em>{content.emphasis}</em></h2><p>{content.description}</p>
        <EditorialLink>{content.ctaLabel || 'ENTER GRADBOOK'}</EditorialLink>
      </div>
      <div className="editorial-prologue-photo" style={content.imageUrl ? { backgroundImage: `url(${content.imageUrl})` } : undefined} role="img" aria-label="Sorsogon National High School campus"><span>THE SNHS CAMPUS</span></div>
    </section>
  )
}
