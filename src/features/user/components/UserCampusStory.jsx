import { ArrowDownRight, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function UserCampusStory({ story }) {
  const title = story?.title || 'More than a campus. A story still unfolding.'
  return (
    <section className="user-campus-story" id="school-story" data-reveal>
      <div className="user-campus-film">
        {story?.imageUrl ? <img src={story.imageUrl} alt={story.title} /> : <video autoPlay muted loop playsInline preload="metadata" poster="/school.jpg" aria-label="A moving view of the Sorsogon National High School campus"><source src="/snhs-3d.mp4" type="video/mp4" /></video>}
        <div className="user-campus-film-shade" aria-hidden="true" />
        <span className="user-film-label"><PlayCircle size={17} /> CAMPUS IN MOTION</span>
      </div>
      <div className="user-campus-copy">
        <span className="user-eyebrow">{story?.category || 'A LIVING LEGACY'}</span>
        <h2>{title}</h2>
        <p>{story?.body || 'Since 1903, generations have filled these halls with ambition, friendship, service, and memories. GradBook gives those chapters a lasting digital home.'}</p>
        <div className="user-campus-facts">
          <div><strong>1903</strong><span>The opening chapter</span></div>
          <div><strong>Today</strong><span>A growing community archive</span></div>
        </div>
        <Link to="/community/updates">Continue through the story <ArrowDownRight size={17} /></Link>
      </div>
    </section>
  )
}
