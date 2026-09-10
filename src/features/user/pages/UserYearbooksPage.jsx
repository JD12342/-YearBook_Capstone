import { useOutletContext } from 'react-router-dom'
import { useScrollReveal } from '../../public/hooks/useScrollReveal.js'
import { UserYearbookShelf } from '../components/UserYearbookShelf.jsx'

export function UserYearbooksPage() {
  const { content } = useOutletContext()
  useScrollReveal('.user-route-yearbooks [data-reveal]')

  return (
    <div className="user-route-page user-route-yearbooks">
      <UserYearbookShelf yearbooks={content.yearbooks} />
    </div>
  )
}
