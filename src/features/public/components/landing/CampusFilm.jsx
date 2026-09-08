import { campusFilmContent, landingMedia } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

export function CampusFilm() {
  return (
    <section className="editorial-film" data-reveal>
      <video autoPlay muted loop playsInline preload="metadata" poster={landingMedia.school} aria-label="A moving view of Sorsogon National High School">
        <source src={landingMedia.campusFilm} type="video/mp4" />
      </video>
      <div className="editorial-film-shade" aria-hidden="true" />
      <div className="editorial-film-copy">
        <span className="editorial-kicker">{campusFilmContent.kicker}</span>
        <h2>{campusFilmContent.title}</h2>
        <p>{campusFilmContent.description}</p>
        <EditorialLink>BECOME PART OF THE STORY</EditorialLink>
      </div>
    </section>
  )
}
