import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db, isFirebaseConfigured } from './firebase.js'

const fallbackAnnouncements = [
  { id: 'welcome', title: 'Welcome to GradBook', body: 'Your digital home for school updates, shared memories, and the people who make every class meaningful.', audience: 'Everyone' },
]

const fallbackHistory = [
  { id: 'roots', label: 'Our roots', title: 'A story worth keeping', body: 'This is where the school can preserve the beginnings, milestones, and people that shaped its identity.' },
  { id: 'community', label: 'Our community', title: 'Made by many hands', body: 'Every graduating class, teacher, family, and supporter adds a chapter to the school story.' },
  { id: 'future', label: 'Our future', title: 'Carried forward', body: 'New memories can live beside the old ones, connecting today’s learners to the generations before them.' },
]

const formatDate = (value) => {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date) : 'Recently published'
}

const sortNewest = (records) => [...records].sort((left, right) => Number(right.updatedAt?.seconds || right.createdAt?.seconds || 0) - Number(left.updatedAt?.seconds || left.createdAt?.seconds || 0))

export function App() {
  const [activePage, setActivePage] = useState('home')
  const [announcements, setAnnouncements] = useState(fallbackAnnouncements)
  const [history, setHistory] = useState(fallbackHistory)
  const [alumni, setAlumni] = useState([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const [contentError, setContentError] = useState('')
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Student' })
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [alumniSearch, setAlumniSearch] = useState('')

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, setUser)
  }, [])

  const loadContent = async () => {
    if (!db) {
      setIsLoading(false)
      return
    }
    setIsLoading(true); setContentError('')
    try {
      const [announcementSnap, contentSnap, alumniSnap] = await Promise.all([
        getDocs(collection(db, 'announcements')),
        getDocs(collection(db, 'schoolContent')),
        getDocs(collection(db, 'alumni')),
      ])
      const publishedAnnouncements = sortNewest(announcementSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.status === 'published'))
      const publishedContent = sortNewest(contentSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.status === 'published'))
      const activeAlumni = sortNewest(alumniSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.status === 'active' || !item.status))
      setAnnouncements(publishedAnnouncements.length ? publishedAnnouncements : fallbackAnnouncements)
      const historyPosts = publishedContent.filter((item) => /history|story|heritage|milestone/i.test(item.category || item.title || ''))
      setHistory(historyPosts.length ? historyPosts.map((item, index) => ({ id: item.id, label: item.category || `Chapter ${index + 1}`, title: item.title, body: item.body || 'A school story shared by the GradBook community.' })) : fallbackHistory)
      setAlumni(activeAlumni)
    } catch {
      setContentError('Live school content is unavailable right now. You can still explore the welcome experience.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadContent() }, [])

  const goTo = (page) => {
    setActivePage(page)
    requestAnimationFrame(() => document.getElementById('client-content')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    if (!auth || !db) {
      setAuthMessage('Connect this client app to Firebase before signing in.')
      return
    }
    setAuthBusy(true); setAuthMessage('')
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, authForm.email.trim(), authForm.password)
        setAuthMode('')
      } else {
        const credential = await createUserWithEmailAndPassword(auth, authForm.email.trim(), authForm.password)
        try {
          await addDoc(collection(db, 'accountRequests'), {
            uid: credential.user.uid,
            fullName: authForm.name.trim() || authForm.email.trim(),
            email: authForm.email.trim(),
            role: authForm.role,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          setAuthMessage('Your account request has been sent to the school administrator.')
        } catch {
          setAuthMessage('Your account was created. Ask the school administrator to verify your access.')
        }
      }
    } catch (error) {
      const friendlyMessage = error?.code === 'auth/email-already-in-use' ? 'An account already exists for this email.' : error?.code === 'auth/invalid-credential' ? 'That email or password is not correct.' : 'We could not complete that request. Please check your details and try again.'
      setAuthMessage(friendlyMessage)
    } finally {
      setAuthBusy(false)
    }
  }

  const visibleAlumni = useMemo(() => alumni.filter((person) => [person.fullName, person.graduationYear, person.occupation].filter(Boolean).join(' ').toLowerCase().includes(alumniSearch.toLowerCase())), [alumni, alumniSearch])

  return (
    <div className="client-app">
      <header className="site-header">
        <button type="button" className="brand" onClick={() => goTo('home')} aria-label="GradBook home"><span className="brand-mark">G</span><span><strong>GRADBOOK</strong><small>Sorsogon National High School</small></span></button>
        <nav className="site-nav" aria-label="Main navigation">
          {[['home', 'Home'], ['updates', 'Updates'], ['history', 'School history'], ['alumni', 'Alumni']].map(([key, label]) => <button key={key} type="button" className={activePage === key ? 'active' : ''} onClick={() => goTo(key)}>{label}</button>)}
        </nav>
        {user ? <button type="button" className="account-chip" onClick={() => goTo('profile')}><span>{(user.email || 'G').slice(0, 1).toUpperCase()}</span><b>My profile</b></button> : <button type="button" className="sign-in-button" onClick={() => { setAuthMode('signin'); setAuthMessage('') }}>Sign in</button>}
      </header>

      <main id="client-content">
        {activePage === 'home' && <HomePage announcements={announcements} loading={isLoading} onNavigate={goTo} />}
        {activePage === 'updates' && <UpdatesPage announcements={announcements} loading={isLoading} onRefresh={loadContent} />}
        {activePage === 'history' && <HistoryPage history={history} loading={isLoading} onNavigate={goTo} />}
        {activePage === 'alumni' && <AlumniPage alumni={visibleAlumni} allCount={alumni.length} search={alumniSearch} onSearch={setAlumniSearch} loading={isLoading} />}
        {activePage === 'profile' && <ProfilePage user={user} onSignOut={async () => { await signOut(auth); goTo('home') }} />}
      </main>

      {contentError && <div className="content-notice"><span>○</span>{contentError}<button type="button" onClick={loadContent}>Try again</button></div>}
      <footer className="site-footer"><div><span className="footer-mark">G</span><strong>GradBook</strong><p>Remembering the people and moments that shape every class.</p></div><div><span>For the school community</span><button type="button" onClick={() => goTo('history')}>Our school story</button><button type="button" onClick={() => goTo('alumni')}>Alumni community</button></div></footer>

      {authMode && <AuthDialog mode={authMode} form={authForm} message={authMessage} busy={authBusy} onChange={(key, value) => setAuthForm((current) => ({ ...current, [key]: value }))} onSubmit={submitAuth} onClose={() => setAuthMode('')} onModeChange={(mode) => { setAuthMode(mode); setAuthMessage('') }} />}
    </div>
  )
}

function HomePage({ announcements, loading, onNavigate }) {
  const latest = announcements[0]
  return <>
    <section className="hero-section"><div className="hero-copy"><span className="eyebrow">THE DIGITAL HOME OF SNHS</span><h1>Every school year<br /><em>has a story</em> worth keeping.</h1><p>GradBook brings the people, milestones, and shared memories of Sorsogon National High School together in one welcoming place.</p><div className="hero-actions"><button type="button" className="primary-action" onClick={() => onNavigate('history')}>Explore our story <span>→</span></button><button type="button" className="quiet-action" onClick={() => onNavigate('updates')}>See school updates</button></div></div><div className="hero-panel"><span className="panel-kicker">A LIVING YEARBOOK</span><div className="hero-quote">“The memories we make together become part of something bigger.”</div><div className="hero-panel-bottom"><span>For students, alumni, and families</span><b>SNHS</b></div></div></section>
    <section className="home-section"><div className="section-heading"><div><span className="eyebrow">WHAT’S HAPPENING</span><h2>From the school community</h2></div><button type="button" className="text-link" onClick={() => onNavigate('updates')}>View all updates →</button></div><div className="announcement-grid">{loading ? <LoadingCards count={3} /> : announcements.slice(0, 3).map((item) => <article className="announcement-card" key={item.id}><span>{item.audience || 'School update'}</span><h3>{item.title}</h3><p>{item.body}</p><small>{formatDate(item.updatedAt || item.createdAt)}</small></article>)}</div></section>
    <section className="history-callout"><div><span className="eyebrow">SCHOOL HISTORY</span><h2>More than a timeline.<br />A shared <em>inheritance.</em></h2><p>Read the school story as it is carefully preserved and carried forward by its community.</p><button type="button" className="dark-action" onClick={() => onNavigate('history')}>Visit the history room <span>→</span></button></div><div className="history-stat"><strong>01</strong><span>place to keep the stories that matter</span></div></section>
    {latest && <section className="feature-strip"><span>Latest note</span><p>{latest.title}</p><button type="button" onClick={() => onNavigate('updates')}>Read update →</button></section>}
  </>
}

function UpdatesPage({ announcements, loading, onRefresh }) {
  return <section className="page-section"><div className="page-intro"><span className="eyebrow">SCHOOL UPDATES</span><h1>News from the community.</h1><p>Announcements and notes published by the school administration.</p><button className="refresh-button" type="button" onClick={onRefresh}>Refresh updates</button></div><div className="updates-list">{loading ? <LoadingCards count={4} /> : announcements.map((item) => <article className="update-row" key={item.id}><div className="update-date">{formatDate(item.updatedAt || item.createdAt)}</div><div><span>{item.audience || 'School update'}</span><h2>{item.title}</h2><p>{item.body}</p></div></article>)}</div></section>
}

function HistoryPage({ history, loading, onNavigate }) {
  return <section className="history-page"><div className="history-hero"><span className="eyebrow">THE SCHOOL STORY</span><p className="history-index">EST. IN MEMORY</p><h1>Where the past<br />still <em>speaks.</em></h1><p className="history-lead">A thoughtful space for the people, turning points, and values that have shaped Sorsogon National High School.</p><div className="history-hero-line"><span>SCROLL TO EXPLORE</span><i /></div></div><div className="history-editor-note"><span>THE HISTORY ROOM</span><p>The school administration can add published history and story entries from the Content & Alumni section. They will appear here automatically.</p></div><div className="timeline">{loading ? <LoadingCards count={3} /> : history.map((item, index) => <article className="timeline-entry" key={item.id}><div className="timeline-marker"><span>{String(index + 1).padStart(2, '0')}</span></div><div className="timeline-content"><span>{item.label}</span><h2>{item.title}</h2><p>{item.body}</p></div></article>)}</div><section className="history-closing"><span className="eyebrow">THE NEXT CHAPTER</span><h2>The story continues<br />with <em>every class.</em></h2><button type="button" className="primary-action" onClick={() => onNavigate('alumni')}>Meet the alumni community <span>→</span></button></section></section>
}

function AlumniPage({ alumni, allCount, search, onSearch, loading }) {
  return <section className="page-section alumni-page"><div className="page-intro"><span className="eyebrow">ALUMNI COMMUNITY</span><h1>The people beyond the pages.</h1><p>Find graduates and see the paths that began at Sorsogon National High School.</p></div><div className="alumni-toolbar"><label><span>Search alumni</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Name, year, or field" /></label><b>{allCount} featured alumni</b></div>{loading ? <div className="alumni-grid"><LoadingCards count={3} /></div> : alumni.length ? <div className="alumni-grid">{alumni.map((person) => <article className="alumni-card" key={person.id}><div className="alumni-avatar">{(person.fullName || 'A').split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><span>CLASS OF {person.graduationYear || '—'}</span><h2>{person.fullName}</h2><p>{person.occupation || 'SNHS alumnus'}</p>{person.email && <a href={`mailto:${person.email}`}>Get in touch →</a>}</article>)}</div> : <div className="empty-panel"><h2>No alumni found</h2><p>Try another search, or check back when more alumni profiles are published.</p></div>}</section>
}

function ProfilePage({ user, onSignOut }) {
  if (!user) return <section className="page-section"><div className="empty-panel"><h2>You are not signed in</h2><p>Sign in to view your GradBook profile.</p></div></section>
  return <section className="page-section"><div className="profile-card"><div className="profile-avatar">{(user.email || 'G')[0].toUpperCase()}</div><div><span className="eyebrow">MY PROFILE</span><h1>{user.email}</h1><p>Your GradBook account is connected. School access requests are reviewed by the administrator.</p></div><button type="button" className="quiet-action" onClick={onSignOut}>Sign out</button></div></section>
}

function AuthDialog({ mode, form, message, busy, onChange, onSubmit, onClose, onModeChange }) {
  const signingUp = mode === 'signup'
  return <div className="dialog-backdrop" role="presentation"><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button><span className="eyebrow">GRADBOOK COMMUNITY</span><h2 id="auth-title">{signingUp ? 'Join the school story.' : 'Welcome back.'}</h2><p>{signingUp ? 'Create an account and send your access request to the school.' : 'Sign in to continue with your GradBook account.'}</p><form onSubmit={onSubmit}>{signingUp && <label>Full name<input required value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Your full name" /></label>}<label>Email address<input required type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="you@email.com" /></label><label>Password<input required type="password" minLength="6" value={form.password} onChange={(event) => onChange('password', event.target.value)} placeholder="At least 6 characters" /></label>{signingUp && <label>Account type<select value={form.role} onChange={(event) => onChange('role', event.target.value)}><option>Student</option><option>Alumni</option><option>Staff</option></select></label>}{message && <div className="auth-message">{message}</div>}<button className="primary-action auth-submit" disabled={busy} type="submit">{busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'} <span>→</span></button></form><button className="auth-switch" type="button" onClick={() => onModeChange(signingUp ? 'signin' : 'signup')}>{signingUp ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section></div>
}

function LoadingCards({ count }) { return Array.from({ length: count }, (_, index) => <div className="loading-card" key={index}><i /><i /><i /></div>) }
