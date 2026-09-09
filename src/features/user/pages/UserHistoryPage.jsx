import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserCampusStory } from '../components/UserCampusStory.jsx'

export function UserHistoryPage() {
  useScrollReveal('.user-route-history [data-reveal]')

  return (
    <div className="user-route-page user-route-history">
      <UserCampusStory />
    </div>
  )
}
