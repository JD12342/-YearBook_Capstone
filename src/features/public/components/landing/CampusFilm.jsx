import { campusFilmContent, landingMedia } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

export function CampusFilm() {
  const content = useLandingSection('film', campusFilmContent)
  return (
    <section className="editorial-film" data-reveal>
      <video autoPlay muted loop playsInline preload="metadata" poster={content.imageUrl || landingMedia.school} aria-label="A moving view of Sorsogon National High School">
        <source src={landingMedia.campusFilm} type="video/mp4" />
      </video>
      <div className="editorial-film-shade" aria-hidden="true" />
      <div className="editorial-film-copy">
        <span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}</h2><p>{content.description}</p>
        <EditorialLink>{content.ctaLabel || 'BECOME PART OF THE STORY'}</EditorialLink>
      </div>
    </section>
  )
}
