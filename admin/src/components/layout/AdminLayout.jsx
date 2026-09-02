import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'

const routeMeta = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview' },
  '/students': { title: 'Student Management', subtitle: 'Students' },
  '/photos': { title: 'Photo Management', subtitle: 'Photos' },
  '/photos/editing': { title: 'Photo Editing Queue', subtitle: 'Photos' },
  '/photos/retakes': { title: 'Retake Queue', subtitle: 'Photos' },
  '/photos/existing': { title: 'Existing Photos', subtitle: 'Photos' },
  '/photos/edit/:photoId': { title: 'Photo Editor', subtitle: 'Photos' },
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.startsWith('/photos/edit/') ? '/photos/edit/:photoId' : location.pathname
  const meta = routeMeta[currentPath] ?? { title: 'Dashboard', subtitle: 'Overview' }

  return (
    <div className="admin-shell">
      <Sidebar currentPath={currentPath} onNavigate={(key) => navigate(key)} />
      <div className="content-shell">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
