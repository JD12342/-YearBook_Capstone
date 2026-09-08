import { Link } from 'react-router-dom'
import { landingBrand, landingMedia } from '../../data/landingContent.js'

export function PublicBrand({ footer = false }) {
  return (
    <Link className={`public-brand${footer ? ' public-brand-footer' : ''}`} to="/" aria-label="GradBook home">
      <img src={landingMedia.seal} alt={footer ? '' : 'Sorsogon National High School seal'} />
      <span><strong>{landingBrand.name}</strong><small>{footer ? landingBrand.school : landingBrand.school}</small></span>
    </Link>
  )
}
