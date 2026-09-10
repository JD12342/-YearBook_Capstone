import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserCampusStory } from '../components/UserCampusStory.jsx'

export function UserHistoryPage() {
  const { content } = useOutletContext()
  useScrollReveal('.user-route-history [data-reveal]')
  const story = content.stories.find((item) => item.category === 'School History')
    || content.stories.find((item) => item.category === 'School Story')
    || content.stories[0]

  return (
    <div className="user-route-page user-route-history">
      <UserCampusStory story={story} />
    </div>
  )
}
