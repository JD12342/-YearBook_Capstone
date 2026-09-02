import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function Header({ title, subtitle }) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const profileEmail = user?.email || 'Administrator'
  const initials = profileEmail.slice(0, 2).toUpperCase()

  return (
    <header className="top-header">
      <div>
        <div className="header-kicker">{subtitle}</div>
        <h1>{title}</h1>
      </div>

      <div className="header-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} aria-hidden="true" />
        </button>
        <div className="header-profile-wrap" ref={profileMenuRef}>
          <button
            type="button"
            className="profile-pill"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="profile-avatar">{initials}</span>
            <span className="profile-email">{profileEmail}</span>
            <ChevronDown className="chevron" size={15} aria-hidden="true" />
          </button>

          {profileOpen && (
            <div className="account-menu" role="menu" aria-label="Administrator account menu">
              <div className="account-menu-summary">
                <span className="account-menu-avatar">{initials}</span>
                <span>
                  <strong>Administrator</strong>
                  <small>{profileEmail}</small>
                </span>
              </div>
              <div className="account-menu-divider" />
              <button type="button" className="account-menu-item" role="menuitem" onClick={() => navigate('/profile')}>
                <UserRound size={17} aria-hidden="true" />
                <span><strong>Admin profile</strong><small>Account details and settings</small></span>
              </button>
              <button type="button" className="account-menu-item account-menu-logout" role="menuitem" onClick={handleLogout}>
                <LogOut size={17} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
