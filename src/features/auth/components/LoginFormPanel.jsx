import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, IdCard, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authModeContent, profileTypes } from '../data/authContent.js'
import { Button } from '../../admin/components/ui/Button.jsx'
import { Input } from '../../admin/components/ui/Input.jsx'

export function LoginFormPanel({ error, fields, isSigningUp, notice, onSubmit, onToggleMode, onUpdateField, passwordVisible, setPasswordVisible, submitting }) {
  const content = isSigningUp ? authModeContent.signUp : authModeContent.signIn
  const selectedProfileType = profileTypes.find((profileType) => profileType.value === fields.profileType) || profileTypes[0]

  return (
    <section className={`login-form-panel ${isSigningUp ? 'is-signing-up' : ''}`.trim()} aria-labelledby="login-title">
      <div className="login-form-header">
        <Link className="login-back-link" to="/"><ArrowLeft size={15} /> Back to GradBook</Link>
        <span className="login-console-label">{content.label}</span>
        <h2 id="login-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <form className="login-form" onSubmit={onSubmit}>
        {isSigningUp && (
          <label className="form-field">
            <span>Full name</span>
            <div className="login-input-wrap"><UserRound size={18} aria-hidden="true" /><Input className="login-input" value={fields.fullName} onChange={(event) => onUpdateField('fullName', event.target.value)} placeholder="Your full name" required /></div>
          </label>
        )}
        {isSigningUp && (
          <label className="form-field">
            <span>I am registering as</span>
            <select className="login-role-select" value={fields.profileType} onChange={(event) => onUpdateField('profileType', event.target.value)}>
              {profileTypes.map((profileType) => <option key={profileType.value} value={profileType.value}>{profileType.label}</option>)}
            </select>
          </label>
        )}
        {isSigningUp && (
          <label className="form-field">
            <span>{selectedProfileType.referenceLabel}</span>
            <div className="login-input-wrap">
              <IdCard size={18} aria-hidden="true" />
              <Input className="login-input" value={fields.referenceId} onChange={(event) => onUpdateField('referenceId', event.target.value)} placeholder={selectedProfileType.referencePlaceholder} required />
            </div>
          </label>
        )}
        <label className="form-field">
          <span>Email address</span>
          <div className="login-input-wrap">
            <Mail size={18} aria-hidden="true" />
            <Input className="login-input" type="email" autoComplete="email" value={fields.email} onChange={(event) => onUpdateField('email', event.target.value)} placeholder="you@school.edu" required />
          </div>
        </label>
        <label className="form-field">
          <span>Password</span>
          <div className="login-input-wrap">
            <LockKeyhole size={18} aria-hidden="true" />
            <Input className="login-input" type={passwordVisible ? 'text' : 'password'} autoComplete={isSigningUp ? 'new-password' : 'current-password'} value={fields.password} onChange={(event) => onUpdateField('password', event.target.value)} placeholder="Enter your password" required />
            <button className="login-password-toggle" type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>
              {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>
        {notice && <div className="form-success" role="status">{notice}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        {isSigningUp && <div className="login-profile-note"><BadgeCheck size={15} aria-hidden="true" /><span>Your selection describes your school profile only. Administrator access cannot be requested here.</span></div>}
        <label className="remember-row">
          <input type="checkbox" checked={fields.rememberMe} onChange={(event) => onUpdateField('rememberMe', event.target.checked)} />
          <span>Keep me signed in on this device</span>
        </label>
        <Button type="submit" disabled={submitting} className="login-button">
          <span>{submitting ? 'Please wait...' : content.submit}</span>
          {!submitting && <ArrowRight size={17} aria-hidden="true" />}
        </Button>
        <button className="login-mode-switch" type="button" onClick={onToggleMode}>{content.switch}</button>
      </form>
    </section>
  )
}
