import { featuredStoriesContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'
import { useLandingSection } from '../../hooks/useLandingContent.js'

export function FeaturedStories() {
  const content = useLandingSection('highlights', featuredStoriesContent)
  return (
    <section className="editorial-stories" data-reveal>
      <div className="editorial-stories-heading">
        <div><span className="editorial-kicker">{content.eyebrow || content.kicker}</span><h2>{content.title}</h2></div><p>{content.description}</p>
      </div>
      <div className="editorial-story-card-grid">
        {content.stories.map((story) => (
          <article className="editorial-story-card" key={story.number}>
            <div className={`editorial-story-image ${story.imageClass}`} role="img" aria-label={story.title}><span>{story.number}</span></div>
            <small>{story.label}</small>
            <h3>{story.title}</h3>
            <p>{story.body}</p>
            <EditorialLink>READ THE FULL CHAPTER</EditorialLink>
          </article>
        ))}
      </div>
    </section>
  )
}
