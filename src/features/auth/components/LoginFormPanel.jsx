import { ArrowLeft, ArrowRight, Eye, EyeOff, IdCard, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authModeContent, profileTypes } from '../data/authContent.js'

export function LoginFormPanel({ academicOptions, academicOptionsLoading, error, fields, isSigningUp, notice, onSubmit, onToggleMode, onUpdateField, passwordVisible, setPasswordVisible, submitting }) {
  const content = isSigningUp ? authModeContent.signUp : authModeContent.signIn
  const selectedProfileType = profileTypes.find((profileType) => profileType.value === fields.profileType) || profileTypes[0]
  const availableStrands = (academicOptions?.strands || []).filter((strand) => strand.schoolYearId === fields.schoolYearId)
  const availableSections = (academicOptions?.sections || []).filter((section) => section.schoolYearId === fields.schoolYearId && section.strandId === fields.strandId)

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
          <label className="form-field signup-field-full">
            <span>Full name</span>
            <div className="login-input-wrap"><UserRound size={18} aria-hidden="true" /><input className="field login-input" value={fields.fullName} onChange={(event) => onUpdateField('fullName', event.target.value)} placeholder="Your full name" required /></div>
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
              <input className="field login-input" value={fields.referenceId} onChange={(event) => onUpdateField('referenceId', event.target.value)} placeholder={selectedProfileType.referencePlaceholder} required />
            </div>
          </label>
        )}
        {isSigningUp && (
          <fieldset className="signup-academic-fields" disabled={academicOptionsLoading}>
            <legend>Academic assignment</legend>
            <label className="form-field"><span>School year</span><select className="login-role-select" value={fields.schoolYearId} onChange={(event) => onUpdateField('schoolYearId', event.target.value)} required><option value="">{academicOptionsLoading ? 'Loading school years…' : 'Choose school year'}</option>{(academicOptions?.schoolYears || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="form-field"><span>Strand</span><select className="login-role-select" value={fields.strandId} onChange={(event) => onUpdateField('strandId', event.target.value)} disabled={!fields.schoolYearId || academicOptionsLoading} required><option value="">Choose strand</option>{availableStrands.map((item) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}</select></label>
            <label className="form-field"><span>Section</span><select className="login-role-select" value={fields.sectionId} onChange={(event) => onUpdateField('sectionId', event.target.value)} disabled={!fields.strandId || academicOptionsLoading} required><option value="">Choose section</option>{availableSections.map((item) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}</select></label>
          </fieldset>
        )}
        <label className={`form-field ${isSigningUp ? '' : 'signup-field-full'}`.trim()}>
          <span>Email address</span>
          <div className="login-input-wrap">
            <Mail size={18} aria-hidden="true" />
            <input className="field login-input" type="email" autoComplete="email" value={fields.email} onChange={(event) => onUpdateField('email', event.target.value)} placeholder="you@school.edu" required />
          </div>
        </label>
        <label className={`form-field ${isSigningUp ? '' : 'signup-field-full'}`.trim()}>
          <span>Password</span>
          <div className="login-input-wrap">
            <LockKeyhole size={18} aria-hidden="true" />
            <input className="field login-input" type={passwordVisible ? 'text' : 'password'} autoComplete={isSigningUp ? 'new-password' : 'current-password'} value={fields.password} onChange={(event) => onUpdateField('password', event.target.value)} placeholder="Enter your password" required />
            <button className="login-password-toggle" type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>
              {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>
        {notice && <div className="form-success" role="status">{notice}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <label className="remember-row">
          <input type="checkbox" checked={fields.rememberMe} onChange={(event) => onUpdateField('rememberMe', event.target.checked)} />
          <span>Keep me signed in on this device</span>
        </label>
        <button type="submit" disabled={submitting} className="btn btn-primary btn-md login-button">
          <span>{submitting ? 'Please wait...' : content.submit}</span>
          {!submitting && <ArrowRight size={17} aria-hidden="true" />}
        </button>
        <button className="login-mode-switch" type="button" onClick={onToggleMode}>{content.switch}</button>
      </form>
    </section>
  )
}
