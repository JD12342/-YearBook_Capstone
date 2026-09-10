import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { UserPortalFooter } from '../components/UserPortalFooter.jsx'
import { UserPortalHeader } from '../components/UserPortalHeader.jsx'
import { loadUserPortalContent } from '../services/userPortalService.js'
import '../styles/userPortal.css'

const emptyContent = { announcements: [], yearbooks: [], stories: [], alumni: [], hasLiveContent: false }

export function UserPortalLayout() {
  const { logout, profile, role, user } = useAuth()
  const location = useLocation()
  const [content, setContent] = useState(emptyContent)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    let active = true
    loadUserPortalContent()
      .then((nextContent) => { if (active) setContent(nextContent) })
      .finally(() => { if (active) setContentReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'GradBook member'
  const isImmersiveYearbook = /^\/community\/yearbooks\/[^/]+\/?$/.test(location.pathname)
  const isYearbookSpace = /^\/community\/yearbooks(?:\/|$)/.test(location.pathname)

  return (
    <div
      className={`user-portal ${isYearbookSpace ? 'is-yearbook-space' : ''} ${isImmersiveYearbook ? 'is-immersive' : ''}`}
      id="user-portal-top"
    >
      {!isImmersiveYearbook && <UserPortalHeader profile={profile} role={role} user={user} logout={logout} />}
      <main className={`user-portal-main ${isImmersiveYearbook ? 'user-portal-main-immersive' : ''}`}>
        <Outlet context={{ content, contentReady, displayName, profile }} />
      </main>
      {!isImmersiveYearbook && <UserPortalFooter />}
    </div>
  )
}
