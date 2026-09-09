import { ArrowDownRight, BadgeCheck, BookOpenText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UserHero({ displayName, profileType }) {
  const firstName = displayName.split(/\s+/).filter(Boolean)[0] || 'there'

  return (
    <section className="user-hero" id="overview">
      <div className="user-hero-copy">
        <span className="user-eyebrow">YOUR SNHS DIGITAL ARCHIVE</span>
        <h1>Welcome back, <em>{firstName}.</em></h1>
        <p>Step into the yearbooks, school stories, portraits, and memories that keep every generation connected.</p>
        <div className="user-hero-actions">
          <Link className="user-primary-action" to="/community/yearbooks">Explore the archive <ArrowDownRight size={18} /></Link>
          <Link className="user-text-action" to="/community/history"><BookOpenText size={17} /> Read the school story</Link>
        </div>
        <div className="user-verified-line"><BadgeCheck size={18} /><span><strong>Verified community access</strong>{profileType ? ` · ${profileType} profile` : ''}</span></div>
      </div>

      <div className="user-hero-visual" aria-label="Sorsogon National High School campus">
        <img className="user-hero-school" src="/school.jpg" alt="Sorsogon National High School campus" />
        <div className="user-hero-overlay" aria-hidden="true" />
        <div className="user-hero-seal"><img src="/snhs-seal.png" alt="" /><span>ONE SCHOOL<br />EVERY GENERATION</span></div>
        <div className="user-hero-year"><small>THE LEGACY BEGINS</small><strong>1903</strong></div>
      </div>
    </section>
  )
}
