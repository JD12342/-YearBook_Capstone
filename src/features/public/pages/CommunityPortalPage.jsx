import { ArrowRight, BookOpen, GraduationCap, LogOut, Medal, Newspaper, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext.jsx'

export function CommunityPortalPage() {
  const { user, role, logout } = useAuth()
  const canManage = role === 'Administrator' || role === 'Staff'

  return (
    <div className="community-site">
      <header className="community-header">
        <Link className="public-brand" to="/community"><img src="/snhs-seal.png" alt="Sorsogon National High School seal" /><span><strong>GRADBOOK</strong><small>Community access</small></span></Link>
        <div className="community-account"><span>{role}</span><b>{user?.email}</b>{canManage && <Link to="/dashboard">Open workspace <ArrowRight size={15} /></Link>}<button type="button" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div>
      </header>
      <main className="community-main">
        <section className="community-welcome"><span className="public-section-label">WELCOME TO GRADBOOK</span><h1>Your school story is now open.</h1><p>Explore the people, memories, and milestones that connect every SNHS generation.</p></section>
        <section className="community-feature-grid">
          <article><Newspaper size={24} /><span>School updates</span><h2>The latest from campus</h2><p>Read announcements and stories shared by the school administration.</p></article>
          <article><BookOpen size={24} /><span>School history</span><h2>Every chapter preserved</h2><p>Discover the traditions and turning points behind the school we know today.</p></article>
          <article><UsersRound size={24} /><span>Community</span><h2>People beyond the pages</h2><p>Connect names, faces, graduating classes, and alumni journeys.</p></article>
          <article><GraduationCap size={24} /><span>Yearbook</span><h2>Your graduating class</h2><p>See verified profiles, portraits, credentials, and class memories.</p></article>
        </section>
        <section className="community-history"><div><span className="public-section-label">FEATURED CHAPTER</span><h2>A legacy that began in 1903.</h2><p>The complete historical collection can be shaped and published by authorized school staff as GradBook grows.</p></div><Medal size={64} /></section>
      </main>
    </div>
  )
}
