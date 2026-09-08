import { Link } from 'react-router-dom'
import { footerContent } from '../../data/landingContent.js'
import { PublicBrand } from './PublicBrand.jsx'

export function LandingFooter() {
  return (
    <footer className="public-footer public-footer-editorial">
      <div className="public-footer-intro"><PublicBrand footer /><p>{footerContent.description}</p></div>
      <div className="public-footer-links">
        {footerContent.groups.map((group) => (
          <div key={group.title}>
            <b>{group.title}</b>
            {group.links?.map((link) => <Link key={link.label} to={link.to}>{link.label}</Link>)}
            {group.items?.map((item) => <span key={item}>{item}</span>)}
          </div>
        ))}
      </div>
      <p className="public-footer-note">{footerContent.note}</p>
    </footer>
  )
}
