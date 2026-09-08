import { Medal, ShieldCheck, UsersRound } from 'lucide-react'
import { accessContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

const benefitIcons = { secure: ShieldCheck, awards: Medal, community: UsersRound }

export function AccessSection() {
  return (
    <section className="editorial-access" data-reveal>
      <div className="editorial-access-copy">
        <span className="editorial-kicker">{accessContent.kicker}</span>
        <h2>{accessContent.title}</h2>
        <p>{accessContent.description}</p>
        <EditorialLink className="editorial-solid-link">REQUEST ACCESS</EditorialLink>
      </div>
      <div className="editorial-access-panel">
        <span>{accessContent.panelLabel}</span>
        <h3>{accessContent.panelTitle.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h3>
        <ul>
          {accessContent.benefits.map((benefit) => {
            const Icon = benefitIcons[benefit.icon]
            return <li key={benefit.text}><Icon size={17} /> {benefit.text}</li>
          })}
        </ul>
        <EditorialLink to="/login">ALREADY A MEMBER? SIGN IN</EditorialLink>
      </div>
    </section>
  )
}
