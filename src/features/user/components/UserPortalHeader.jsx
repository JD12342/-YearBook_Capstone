import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userPortalNavigation } from '../data/userPortalContent.js'

export function UserPortalHeader({ profile, role, user, logout }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const displayName = profile?.fullName || user?.email || 'GradBook member'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="user-portal-header">
      <Link className="user-portal-brand" to="/community" aria-label="GradBook community home">
        <img src="/snhs-seal.png" alt="" />
        <span><strong>GRADBOOK</strong><small>Sorsogon National High School</small></span>
      </Link>

      <button className="user-mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="user-portal-navigation" aria-label="Toggle portal navigation">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav id="user-portal-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Community sections">
        {userPortalNavigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
      </nav>

      <div className="user-account-actions">
        {role === 'Administrator' && <Link className="user-workspace-link" to="/dashboard"><LayoutDashboard size={16} /> Workspace</Link>}
        <div className="user-account-chip" title={user?.email || ''}>
          <span className="user-account-avatar">{initials || 'GB'}</span>
          <span className="user-account-copy"><strong>{displayName}</strong><small>{profile?.profileType || role}</small></span>
        </div>
        <button className="user-signout" type="button" onClick={handleLogout} disabled={signingOut} aria-label="Sign out of GradBook">
          <LogOut size={17} /><span>{signingOut ? 'Leaving…' : 'Sign out'}</span>
        </button>
      </div>
    </header>
  )
}
