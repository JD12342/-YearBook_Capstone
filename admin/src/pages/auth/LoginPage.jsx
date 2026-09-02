import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'

export function LoginPage() {
  const { loginAdmin, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return <div className="login-shell"><div className="panel-card placeholder-card"><h3>Loading...</h3></div></div>
  }

  if (isAuthenticated) {
    const redirectPath = location.state?.from || '/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await loginAdmin(email, password)
      navigate('/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in. Please check your Firebase credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card panel-card">
        <section className="login-brand-panel" aria-label="GradBook">
          <div className="login-brand-lockup">
            <img className="login-logo" src="/snhs-seal.png" alt="Sorsogon National High School seal" />
            <div>
              <strong>GradBook</strong>
              <span>Sorsogon National High School</span>
            </div>
          </div>

          <div className="login-brand-copy">
            <span className="login-eyebrow">Digital Yearbook</span>
            <h1>Every school year has a story worth keeping.</h1>
            <p>Manage the people, memories, and milestones that make each graduating class unique.</p>
          </div>

          <div className="login-security-note">
            <ShieldCheck size={19} aria-hidden="true" />
            <span><strong>Private administrator access</strong><small>For authorized school staff only</small></span>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-header">
            <span className="login-console-label">Administrator portal</span>
            <h2 id="login-title">Welcome back</h2>
            <p>Sign in to continue managing your school yearbook.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email address</span>
              <div className="login-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <Input
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.edu"
                  required
                />
              </div>
            </label>

            <label className="form-field">
              <span>Password</span>
              <div className="login-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <Input
                  className="login-input"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Keep me signed in on this device</span>
            </label>

            <Button type="submit" disabled={submitting} className="login-button">
              <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
              {!submitting && <ArrowRight size={17} aria-hidden="true" />}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
