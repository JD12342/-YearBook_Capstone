import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenText, Layers3, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { getDashboardStats } from '../services/dashboardService.js'
import { isFirebaseConfigured } from '../services/firebase/firebaseConfig.js'

function DistributionList({ entries }) {
  if (!entries?.length) return <div className="empty-state">No data available yet.</div>

  const largestValue = Math.max(...entries.map((entry) => entry.value), 1)

  return (
    <div className="progress-list">
      {entries.map((entry) => (
        <div key={entry.label} className="progress-row">
          <div className="progress-label-row">
            <span>{entry.label}</span>
            <span>{entry.value}</span>
          </div>
          <div className="progress-bar-track" aria-label={`${entry.label}: ${entry.value}`}>
            <div className="progress-bar-fill" style={{ width: `${(entry.value / largestValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
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

      setLoading(true)
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
    { title: 'Student Directory', description: 'Organize student records for every graduating class.', metric: stats.totalStudents ?? 0, metricLabel: 'student records', icon: <Users size={66} strokeWidth={1.5} />, route: '/students', tone: 'feature-forest' },
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
        <>
          <div className="dashboard-grid">
            <Card className="panel-card">
              <div className="section-title-row">
                <div><h3>Students by School Year</h3><span className="panel-caption">Enrollment overview</span></div>
              </div>
              <DistributionList entries={stats.studentsBySchoolYear} />
            </Card>

            <Card className="panel-card">
              <div className="section-title-row">
                <div><h3>Students by Strand</h3><span className="panel-caption">Academic distribution</span></div>
              </div>
              <DistributionList entries={stats.studentsByStrand} />
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
