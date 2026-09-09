import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserUpdates } from '../components/UserUpdates.jsx'

export function UserUpdatesPage() {
  const { content } = useOutletContext()
  useScrollReveal('.user-route-updates [data-reveal]')

  return (
    <div className="user-route-page user-route-updates">
      <UserUpdates
        announcements={content.announcements}
        stories={content.stories}
        alumniCount={content.alumni.length}
      />
    </div>
  )
}
