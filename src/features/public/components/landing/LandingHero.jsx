import { ArrowRight, GraduationCap, LockKeyhole, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { heroContent, landingMedia } from '../../data/landingContent.js'

export function LandingHero() {
  return (
    <section className="public-hero">
      <div className="public-hero-image" aria-hidden="true" />
      <video className="public-hero-video" autoPlay muted loop playsInline preload="metadata" poster={landingMedia.school} aria-hidden="true">
        <source src={landingMedia.campusFilm} type="video/mp4" />
      </video>
      <div className="public-hero-overlay" aria-hidden="true" />
      <div className="public-hero-content">
        <span className="public-eyebrow"><Sparkles size={15} /> {heroContent.eyebrow}</span>
        <h1>{heroContent.title}<br />{heroContent.titleLine} <em>{heroContent.emphasis}</em></h1>
        <p>{heroContent.description}</p>
        <div className="public-hero-actions">
          <Link className="public-primary" to="/login?mode=signup">Become part of the story <ArrowRight size={18} /></Link>
          <Link className="public-secondary" to="/login">I already have access</Link>
        </div>
        <div className="public-trust"><LockKeyhole size={15} /><span>Full school records are available only to verified members.</span></div>
      </div>
      <div className="public-yearbook-card" aria-label="GradBook introduction">
        <span>A LIVING YEARBOOK</span>
        <GraduationCap size={42} />
        <blockquote>{heroContent.quote}</blockquote>
        <div><b>{heroContent.year}</b><small>{heroContent.yearNote}</small></div>
      </div>
      <div className="public-scroll-cue" aria-hidden="true"><span>SCROLL TO DISCOVER</span><i /></div>
    </section>
  )
}
