import { ArrowUpRight, BookOpen, Landmark, Sparkles } from 'lucide-react'
import { userHighlights } from '../data/userPortalContent.js'

const icons = {
  book: BookOpen,
  landmark: Landmark,
  sparkles: Sparkles,
}

export function UserHighlights() {
  return (
    <section className="user-section user-highlights" id="explore" data-reveal>
      <div className="user-section-heading">
        <div><span className="user-eyebrow">EXPLORE GRADBOOK</span><h2>Everything worth remembering, <em>within reach.</em></h2></div>
        <p>GradBook brings the school’s past and present into one calm, view-only space for the verified SNHS community.</p>
      </div>
      <div className="user-highlight-grid">
        {userHighlights.map((item, index) => {
          const Icon = icons[item.icon]
          return (
            <a className={`user-highlight-card user-highlight-card-${index + 1}`} href={item.href} key={item.title}>
              <span className="user-highlight-icon"><Icon size={22} /></span>
              <span className="user-card-index">0{index + 1}</span>
              <div><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.description}</p></div>
              <span className="user-card-link">Discover <ArrowUpRight size={16} /></span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
