import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserHero } from '../components/UserHero.jsx'
import { UserContentStatus } from '../components/UserContentStatus.jsx'

export function UserHomePage() {
  const { content, contentReady, displayName, profile } = useOutletContext()
  useScrollReveal('.user-route-overview [data-reveal]')

  return (
    <div className="user-route-page user-route-overview">
      <UserHero displayName={displayName} profileType={profile?.profileType} />
      <UserContentStatus content={content} contentReady={contentReady} />
      <section className="user-overview-note" data-reveal>
        <span className="user-eyebrow">YOUR COMMUNITY SPACE</span>
        <h2>One archive.<br /><em>Five focused spaces.</em></h2>
        <p>Use the navigation above to explore each part of GradBook on its own page. Your place in one page will no longer affect another.</p>
      </section>
    </div>
  )
}
