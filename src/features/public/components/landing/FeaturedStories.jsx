import { featuredStoriesContent } from '../../data/landingContent.js'
import { EditorialLink } from './EditorialLink.jsx'

export function FeaturedStories() {
  return (
    <section className="editorial-stories" data-reveal>
      <div className="editorial-stories-heading">
        <div><span className="editorial-kicker">{featuredStoriesContent.kicker}</span><h2>{featuredStoriesContent.title}</h2></div>
        <p>{featuredStoriesContent.description}</p>
      </div>
      <div className="editorial-story-card-grid">
        {featuredStoriesContent.stories.map((story) => (
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
