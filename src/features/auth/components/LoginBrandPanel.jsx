import { ShieldCheck } from 'lucide-react'
import { authBrandContent } from '../data/authContent.js'

export function LoginBrandPanel() {
  return (
    <section className="login-brand-panel" aria-label="GradBook">
      <div className="login-brand-lockup">
        <img className="login-logo" src="/snhs-seal.png" alt="Sorsogon National High School seal" />
        <div><strong>{authBrandContent.product}</strong><span>{authBrandContent.school}</span></div>
      </div>
      <div className="login-brand-copy">
        <span className="login-eyebrow">{authBrandContent.eyebrow}</span>
        <h1>{authBrandContent.title}</h1>
        <p>{authBrandContent.description}</p>
      </div>
      <div className="login-security-note">
        <ShieldCheck size={19} aria-hidden="true" />
        <span><strong>{authBrandContent.securityTitle}</strong><small>{authBrandContent.securityDescription}</small></span>
      </div>
    </section>
  )
}
