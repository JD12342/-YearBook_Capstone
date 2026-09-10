import { GraduationCap, UsersRound } from 'lucide-react'

export function UserAlumniDirectory({ alumni = [] }) {
  if (!alumni.length) return null

  return (
    <section className="user-section user-alumni-directory" data-reveal>
      <div className="user-section-heading">
        <div><span className="user-eyebrow">ALUMNI COMMUNITY</span><h2>Where their next chapters <em>began.</em></h2></div>
        <p>Profiles shown here are active records maintained by the school administrator.</p>
      </div>
      <div className="user-alumni-grid">
        {alumni.map((person) => <article key={person.id} className="user-alumni-card">
          <div className="user-alumni-photo">{person.imageUrl ? <img src={person.imageUrl} alt={person.fullName} /> : <UsersRound size={30} />}</div>
          <div><span><GraduationCap size={14} /> {person.graduationYear || 'SNHS alumni'}</span><h3>{person.fullName}</h3>{person.occupation && <strong>{person.occupation}</strong>}<p>{person.biography || 'An active member of the GradBook alumni community.'}</p></div>
        </article>)}
      </div>
    </section>
  )
}
