import { Navigate } from 'react-router-dom'
import { LoginBrandPanel } from '../components/LoginBrandPanel.jsx'
import { LoginFormPanel } from '../components/LoginFormPanel.jsx'
import { useLoginForm } from '../hooks/useLoginForm.js'

export function LoginPage() {
  const loginForm = useLoginForm()

  if (loginForm.loading) {
    return <div className="login-shell"><div className="panel-card placeholder-card"><h3>Loading...</h3></div></div>
  }

  if (loginForm.isAuthenticated) return <Navigate to={loginForm.redirectPath} replace />

  return (
    <div className="login-shell">
      <div className="login-card panel-card">
        <LoginBrandPanel />
        <LoginFormPanel
          error={loginForm.error}
          fields={loginForm.fields}
          isSigningUp={loginForm.isSigningUp}
          onSubmit={loginForm.handleSubmit}
          onToggleMode={loginForm.toggleMode}
          onUpdateField={loginForm.updateField}
          passwordVisible={loginForm.passwordVisible}
          setPasswordVisible={loginForm.setPasswordVisible}
          submitting={loginForm.submitting}
        />
      </div>
    </div>
  )
}
