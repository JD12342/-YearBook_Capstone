import { mosaicContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

export function StoryMosaic() {
  const content = useLandingSection('collection', mosaicContent)
  return (
    <section className="editorial-mosaic" data-reveal aria-label="SNHS story gallery">
      <div className="editorial-mosaic-image mosaic-wide" role="img" aria-label="School campus detail"><span>01</span></div>
      <div className="editorial-mosaic-copy">
        <span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}</h2>
        <EditorialLink>{content.ctaLabel || 'OPEN THE ARCHIVE'}</EditorialLink>
      </div>
      <div className="editorial-mosaic-image mosaic-tall" role="img" aria-label="School building detail"><span>02</span></div>
      <div className="editorial-mosaic-image mosaic-small" role="img" aria-label="School grounds detail"><span>03</span></div>
    </section>
  )
}
