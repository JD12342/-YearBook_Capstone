import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserCampusStory } from '../components/UserCampusStory.jsx'
import { UserHero } from '../components/UserHero.jsx'
import { UserHighlights } from '../components/UserHighlights.jsx'
import { UserPortalFooter } from '../components/UserPortalFooter.jsx'
import { UserPortalHeader } from '../components/UserPortalHeader.jsx'
import { UserUpdates } from '../components/UserUpdates.jsx'
import { UserYearbookShelf } from '../components/UserYearbookShelf.jsx'
import { loadUserPortalContent } from '../services/userPortalService.js'
import '../styles/userPortal.css'

const emptyContent = { announcements: [], yearbooks: [], stories: [], alumni: [], hasLiveContent: false }

export function UserHomePage() {
  const { logout, profile, role, user } = useAuth()
  const [content, setContent] = useState(emptyContent)
  const [contentReady, setContentReady] = useState(false)
  useScrollReveal('.user-portal [data-reveal]')

  useEffect(() => {
    let active = true
    loadUserPortalContent()
      .then((nextContent) => { if (active) setContent(nextContent) })
      .finally(() => { if (active) setContentReady(true) })
    return () => { active = false }
  }, [])

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'GradBook member'

  return (
    <div className="user-portal">
      <UserPortalHeader profile={profile} role={role} user={user} logout={logout} />
      <main>
        <UserHero displayName={displayName} profileType={profile?.profileType} />
        <div className="user-content-status" role="status">
          <span className={content.hasLiveContent ? 'is-live' : ''} />
          {!contentReady ? 'Connecting to the school archive…' : content.hasLiveContent ? 'Showing published school content' : 'Archive preview · published content will appear automatically'}
        </div>
        <UserHighlights />
        <UserYearbookShelf yearbooks={content.yearbooks} isPreview={!content.yearbooks.length} />
        <UserCampusStory />
        <UserUpdates announcements={content.announcements} stories={content.stories} alumniCount={content.alumni.length} />
      </main>
      <UserPortalFooter />
    </div>
  )
}
