import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserHighlights } from '../components/UserHighlights.jsx'

export function UserExplorePage() {
  useScrollReveal('.user-route-explore [data-reveal]')

  return (
    <div className="user-route-page user-route-explore">
      <UserHighlights />
    </div>
  )
}
