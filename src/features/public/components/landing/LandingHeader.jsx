import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PublicBrand } from './PublicBrand.jsx'

export function LandingHeader() {
  return (
    <header className="public-header">
      <PublicBrand />
      <div className="public-auth-actions">
        <Link className="public-signin" to="/login">Sign in</Link>
        <Link className="public-join" to="/login?mode=signup">Request access <ArrowRight size={16} /></Link>
      </div>
    </header>
  )
}
