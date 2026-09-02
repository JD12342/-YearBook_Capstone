import { useEffect, useState } from 'react'
import { BookOpenText, CalendarDays, Camera, Layers3, UserCheck, UserRoundX, Users } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
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

  const statCards = [
    { title: 'TOTAL STUDENTS', value: stats.totalStudents ?? 0, description: 'All student records', icon: <Users size={22} aria-hidden="true" /> },
    { title: 'ACTIVE STUDENTS', value: stats.activeStudents ?? 0, description: 'Current active records', icon: <UserCheck size={22} aria-hidden="true" /> },
    { title: 'ARCHIVED STUDENTS', value: stats.archivedStudents ?? 0, description: 'Archived records', icon: <UserRoundX size={22} aria-hidden="true" /> },
    { title: 'SCHOOL YEARS', value: stats.totalSchoolYears ?? 0, description: 'Academic years', icon: <CalendarDays size={22} aria-hidden="true" /> },
    { title: 'STRANDS', value: stats.totalStrands ?? 0, description: 'Academic strands', icon: <Layers3 size={22} aria-hidden="true" /> },
    { title: 'PHOTOS', value: stats.totalPhotos ?? 0, description: 'Photo metadata records', icon: <Camera size={22} aria-hidden="true" /> },
    { title: 'YEARBOOKS', value: stats.totalYearbooks ?? 0, description: 'Yearbook foundations', icon: <BookOpenText size={22} aria-hidden="true" /> },
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

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard statistics...</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>

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
