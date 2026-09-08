import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-shell auth-loading">
        <div className="panel-card placeholder-card">
          <h3>Checking session…</h3>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname, error: 'Sign in to continue.' }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    const fallbackPath = role === 'Administrator' || role === 'Staff' ? '/dashboard' : '/community'
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
