import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { Header } from './Header.jsx'
import { PageHelpButton } from './PageHelpButton.jsx'
import { Sidebar } from './Sidebar.jsx'
import { loadLocalAdminPreferences } from '../../services/accountSettingsService.js'

const routeMeta = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview', helpText: 'See a quick summary of student records, academic setup, and yearbook preparation.' },
  '/students': { title: 'Student Management', subtitle: 'Students', helpText: 'Search, filter, add, update, archive, or permanently remove student records.' },
  '/academic': { title: 'Academic Management', subtitle: 'Academic', helpText: 'Set up school years, strands, sections, and their yearbook foundations.' },
  '/photos': { title: 'Photo Management', subtitle: 'Photos', helpText: 'Find students and track the progress of their graduation photos.' },
  '/photos/editing': { title: 'Photo Editing Queue', subtitle: 'Photos', helpText: 'Review photos that are waiting for editing before they are approved.' },
  '/photos/retakes': { title: 'Retake Queue', subtitle: 'Photos', helpText: 'Review students who need another graduation photo session.' },
  '/photos/existing': { title: 'Existing Photos', subtitle: 'Photos', helpText: 'Browse the graduation photos already stored in GradBook.' },
  '/photos/camera': { title: 'Camera Session', subtitle: 'Photos', helpText: 'Capture a consistent graduation portrait with the session controls, then save it directly or open the full editor.' },
  '/photos/capture': { title: 'Camera Session', subtitle: 'Photos', helpText: 'Capture a consistent graduation portrait with the session controls, then save it directly or open the full editor.' },
  '/photos/edit/:photoId': { title: 'Photo Editor', subtitle: 'Photos', helpText: 'Make final adjustments to a selected student photo.' },
  '/verification-requests': { title: 'Verification Requests', subtitle: 'User Access', helpText: 'Review and approve or reject account requests before users can access GradBook.' },
  '/teachers': { title: 'Teacher Management', subtitle: 'Access', helpText: 'Assign teachers to class sections and control their memory and video upload limits.' },
  '/content': { title: 'Content Management', subtitle: 'School Content', helpText: 'Manage announcements, section memories, alumni details, and school information shown through GradBook.' },
  '/reports': { title: 'Reports', subtitle: 'Insights', helpText: 'Review GradBook records, portrait readiness, Firestore activity, and connected billing data.' },
  '/settings': { title: 'Settings', subtitle: 'System', helpText: 'Configure your workspace density, navigation, motion, help, and reporting defaults.' },
  '/profile': { title: 'Account Profile', subtitle: 'System', helpText: 'Update your administrator identity, contact details, and sign-in password.' },
}

export function AdminLayout() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [preferences, setPreferences] = useState(loadLocalAdminPreferences)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadLocalAdminPreferences().sidebarDefault === 'collapsed')
  const currentPath = location.pathname.startsWith('/photos/edit/') ? '/photos/edit/:photoId' : location.pathname
  const meta = routeMeta[currentPath] ?? { title: 'Dashboard', subtitle: 'Overview', helpText: 'Use this workspace to manage GradBook.' }

  const handleMenuToggle = () => {
    if (window.matchMedia('(max-width: 980px)').matches) setSidebarOpen(true)
    else setSidebarCollapsed((collapsed) => !collapsed)
  }

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = previousScrollRestoration }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0))
  }, [location.pathname, location.search])

  useEffect(() => {
    const updatePreferences = (event) => {
      const next = event.detail || loadLocalAdminPreferences()
      setPreferences(next)
      setSidebarCollapsed(next.sidebarDefault === 'collapsed')
    }
    window.addEventListener('gradbook-preferences-changed', updatePreferences)
    return () => window.removeEventListener('gradbook-preferences-changed', updatePreferences)
  }, [])

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${preferences.density === 'compact' ? 'admin-density-compact' : ''} ${preferences.reduceMotion ? 'admin-reduce-motion' : ''}`.trim()}>
      <Sidebar currentPath={currentPath} isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onNavigate={(key) => navigate(key)} role={role} />
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="Close navigation menu" onClick={() => setSidebarOpen(false)} />}
      <div className="content-shell">
        <Header title={meta.title} subtitle={meta.subtitle} onMenuToggle={handleMenuToggle} />
        <main className="main-content">
          {preferences.showPageHelp && <PageHelpButton title={meta.title} helpText={meta.helpText} />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
