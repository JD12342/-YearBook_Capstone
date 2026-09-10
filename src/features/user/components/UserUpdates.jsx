import { ArrowUpRight, CalendarDays, Newspaper, UsersRound } from 'lucide-react'
import { previewAnnouncements, previewStories } from '../data/userPortalContent.js'

const formatDate = (record) => {
  const date = record.updatedAt?.toDate?.() || record.createdAt?.toDate?.()
  if (!date) return record.dateLabel || 'SCHOOL UPDATE'
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(date).toUpperCase()
}

export function UserUpdates({ announcements, stories, alumniCount }) {
  const leadStory = stories[0] || previewStories[0]
  const visibleAnnouncements = announcements.length ? announcements.slice(0, 3) : previewAnnouncements

  return (
    <section className="user-section user-updates" id="updates" data-reveal>
      <div className="user-section-heading user-updates-heading">
        <div><span className="user-eyebrow">THE LIVING ARCHIVE</span><h2>New stories, familiar roots.</h2></div>
        <p>Published by the school and presented here for the verified GradBook community.</p>
      </div>

      <div className="user-updates-layout">
        <article className="user-feature-story">
          <img src={leadStory.imageUrl || '/school.jpg'} alt={leadStory.imageUrl ? leadStory.title : 'The Sorsogon National High School campus'} />
          <div className="user-feature-story-shade" aria-hidden="true" />
          <div className="user-feature-story-copy">
            <span>{leadStory.category || 'SCHOOL STORY'}</span>
            <h3>{leadStory.title}</h3>
            <p>{leadStory.body}</p>
            <span className="user-story-link">Featured chapter <ArrowUpRight size={16} /></span>
          </div>
        </article>

        <div className="user-news-list">
          <div className="user-news-list-title"><span><Newspaper size={18} /> Latest from GradBook</span>{alumniCount > 0 && <small><UsersRound size={14} /> {alumniCount} active community profile{alumniCount === 1 ? '' : 's'}</small>}</div>
          {visibleAnnouncements.map((announcement) => (
            <article key={announcement.id || announcement.title}>
              <span className="user-news-date"><CalendarDays size={14} />{formatDate(announcement)}</span>
              <h3>{announcement.title || 'School update'}</h3>
              <p>{announcement.body || 'More information will be shared by the school administration.'}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
