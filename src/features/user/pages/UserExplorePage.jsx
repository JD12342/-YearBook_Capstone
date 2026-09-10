import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserAlumniDirectory } from '../components/UserAlumniDirectory.jsx'
import { UserHighlights } from '../components/UserHighlights.jsx'

export function UserExplorePage() {
  const { content } = useOutletContext()
  useScrollReveal('.user-route-explore [data-reveal]')

  return (
    <div className="user-route-page user-route-explore">
      <UserHighlights />
      <UserAlumniDirectory alumni={content.alumni} />
    </div>
  )
}
