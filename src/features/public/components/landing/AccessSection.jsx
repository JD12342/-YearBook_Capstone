import { Medal, ShieldCheck, UsersRound } from 'lucide-react'
import { accessContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

const benefitIcons = { secure: ShieldCheck, awards: Medal, community: UsersRound }

export function AccessSection() {
  const content = useLandingSection('access', accessContent)
  return (
    <section className="editorial-access" data-reveal>
      <div className="editorial-access-copy">
        <span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}</h2><p>{content.description}</p>
        <EditorialLink className="editorial-solid-link">{content.ctaLabel || 'REQUEST ACCESS'}</EditorialLink>
      </div>
      <div className="editorial-access-panel">
        <span>{content.panelLabel}</span><h3>{content.panelTitle.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h3>
        <ul>
          {content.benefits.map((benefit) => {
            const Icon = benefitIcons[benefit.icon]
            return <li key={benefit.text}><Icon size={17} /> {benefit.text}</li>
          })}
        </ul>
        <EditorialLink to="/login">ALREADY A MEMBER? SIGN IN</EditorialLink>
      </div>
    </section>
  )
}
