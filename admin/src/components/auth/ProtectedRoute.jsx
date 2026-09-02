import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
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
    return <Navigate to="/login" replace state={{ from: location.pathname, error: 'Admin access is required.' }} />
  }

  return <Outlet />
}
