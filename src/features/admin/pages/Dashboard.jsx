import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenText, Layers3, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { getCachedDashboardStats, getDashboardStats } from '../services/dashboardService.js'
import { isFirebaseConfigured } from '../services/firebase/firebaseConfig.js'

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(() => getCachedDashboardStats() || [])
  const [loading, setLoading] = useState(() => !getCachedDashboardStats())
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadStats = async () => {
      if (!isFirebaseConfigured) {
        if (!ignore) {
          setError('Firebase is not configured. Please configure the Admin .env file.')
          setStats([])
        }
        return
      }

      setLoading(!getCachedDashboardStats())
      setError('')

      try {
        const nextStats = await getDashboardStats()
        if (!ignore) setStats(nextStats)
      } catch (loadError) {
        if (!ignore) setError(loadError.message || 'Unable to load dashboard statistics.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadStats()

    return () => {
      ignore = true
    }
  }, [])

  const featureCards = [
    { title: 'Graduation Directory', description: 'Manage student and teacher records for graduation photos and yearbooks.', metric: stats.totalStudents ?? 0, metricLabel: 'student records', icon: <Users size={66} strokeWidth={1.5} />, route: '/graduation-directory', tone: 'feature-forest' },
    { title: 'Academic Setup', description: 'Manage school years, strands, and sections.', metric: stats.totalSchoolYears ?? 0, metricLabel: `${stats.totalStrands ?? 0} academic strands`, icon: <Layers3 size={66} strokeWidth={1.5} />, route: '/academic', tone: 'feature-jade' },
    { title: 'Yearbook Studio', description: 'Prepare the records that shape each digital yearbook.', metric: stats.totalYearbooks ?? 0, metricLabel: `${stats.totalPhotos ?? 0} approved photo records`, icon: <BookOpenText size={66} strokeWidth={1.5} />, route: '/yearbooks', tone: 'feature-emerald' },
  ]

  return (
    <div className="page-stack dashboard-page">
      <div className="page-header-row dashboard-heading">
        <div>
          <div className="page-kicker">OVERVIEW</div>
          <h2>Welcome back, Administrator.</h2>
          <p>Here is a clear view of your yearbook workspace today.</p>
        </div>
      </div>

      <div className="dashboard-feature-grid">
        {featureCards.map((card) => (
          <button key={card.title} type="button" className={`dashboard-feature-card ${card.tone}`} onClick={() => navigate(card.route)}>
            <span className="dashboard-feature-icon" aria-hidden="true">{card.icon}</span>
            <span className="dashboard-feature-content"><strong>{card.title}</strong><small>{card.description}</small><span className="dashboard-feature-metric"><b>{card.metric}</b><em>{card.metricLabel}</em></span></span>
            <span className="dashboard-feature-footer">Open workspace <ArrowRight size={17} aria-hidden="true" /></span>
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard statistics...</div>
      ) : (
        <Card className="school-welcome-card">
          <div className="school-welcome-title">Welcome to Sorsogon National High School</div>
          <div className="school-welcome-content">
            <div className="school-welcome-emblem">
              <img className="school-welcome-logo" src="/snhs-seal.png" alt="Sorsogon National High School seal" />
            </div>
            <div className="school-purpose-copy">
              <section>
                <h3>Vision</h3>
                <p>A trusted digital home where every SNHS graduating class can be remembered and revisited.</p>
              </section>
              <section>
                <h3>Mission</h3>
                <p>GradBook organizes student records, standardizes graduation portraits, and preserves each yearbook for the SNHS community.</p>
              </section>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
