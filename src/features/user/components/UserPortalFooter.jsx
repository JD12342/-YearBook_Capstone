import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UserPortalFooter() {
  return (
    <footer className="user-portal-footer">
      <div className="user-footer-brand">
        <img src="/snhs-seal.png" alt="" />
        <div><strong>GRADBOOK</strong><span>Stories that stay with us.</span></div>
      </div>
      <p>Preserving the portraits, achievements, traditions, and stories that connect every SNHS generation.</p>
      <div className="user-footer-actions"><Link to="/">Public landing page</Link><a href="#user-portal-top">Back to top <ArrowUp size={15} /></a></div>
      <small>© {new Date().getFullYear()} Sorsogon National High School · Verified community access</small>
    </footer>
  )
}
