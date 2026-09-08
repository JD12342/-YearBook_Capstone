import { mosaicContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

export function StoryMosaic() {
  return (
    <section className="editorial-mosaic" data-reveal aria-label="SNHS story gallery">
      <div className="editorial-mosaic-image mosaic-wide" role="img" aria-label="School campus detail"><span>01</span></div>
      <div className="editorial-mosaic-copy">
        <span className="editorial-kicker">{mosaicContent.kicker}</span>
        <h2>{mosaicContent.title}</h2>
        <EditorialLink>OPEN THE ARCHIVE</EditorialLink>
      </div>
      <div className="editorial-mosaic-image mosaic-tall" role="img" aria-label="School building detail"><span>02</span></div>
      <div className="editorial-mosaic-image mosaic-small" role="img" aria-label="School grounds detail"><span>03</span></div>
    </section>
  )
}
