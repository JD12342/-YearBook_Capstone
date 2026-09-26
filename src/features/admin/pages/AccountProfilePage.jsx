import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CheckCircle2, KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { changeAdminPassword, loadAdminAccount, saveAdminAccount } from '../services/accountSettingsService.js'

const emptyProfile = { fullName: '', position: '', phone: '', bio: '' }

export function AccountProfilePage() {
  const { user, role, profile, refreshProfile } = useAuth()
  const [account, setAccount] = useState(emptyProfile)
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    loadAdminAccount(user?.uid).then((record) => {
      if (!active) return
      setAccount({
        fullName: record.fullName || profile?.fullName || user?.displayName || '',
        position: record.position || '',
        phone: record.phone || '',
        bio: record.bio || '',
      })
    }).catch((loadError) => { if (active) setError(loadError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [profile?.fullName, user?.displayName, user?.uid])

  const initials = useMemo(() => (account.fullName || user?.email || 'AD').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), [account.fullName, user?.email])
  const setField = (field, value) => setAccount((current) => ({ ...current, [field]: value }))

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setError('')
    setSuccess('')
    try {
      await saveAdminAccount(user?.uid, account)
      await refreshProfile()
      setSuccess('Account profile updated.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to update your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (password.next !== password.confirm) {
      setError('The new passwords do not match.')
      return
    }
    setPasswordSaving(true)
    try {
      await changeAdminPassword(password.current, password.next)
      setPassword({ current: '', next: '', confirm: '' })
      setSuccess('Password changed successfully.')
    } catch (saveError) {
      setError(saveError.code === 'auth/invalid-credential' ? 'The current password is incorrect.' : saveError.message || 'Unable to change your password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return <div className="page-stack system-page">
    <div className="page-header-row"><div><div className="page-kicker">System</div><h2>Account Profile</h2><p className="page-description">Manage your administrator identity and sign-in password.</p></div></div>

    {success && <div className="form-success" role="status"><CheckCircle2 size={17} /> {success}</div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    <Card className="account-identity-card">
      <div className="account-avatar">{initials || <UserRound size={32} />}</div>
      <div><span className="section-eyebrow"><BadgeCheck size={15} /> Verified administrator</span><h3>{account.fullName || 'GradBook Administrator'}</h3><p>{account.position || 'System administrator'} · {user?.email}</p></div>
      <span className="account-role"><ShieldCheck size={15} /> {role}</span>
    </Card>

    <div className="system-page-grid account-page-grid">
      <Card className="panel-card system-form-card">
        <div className="system-card-heading"><span><UserRound size={19} /></span><div><h3>Profile details</h3><p>Used to identify you inside the management console.</p></div></div>
        {loading ? <div className="empty-state">Loading account profile…</div> : <form onSubmit={saveProfile}>
          <div className="settings-select-grid">
            <label className="form-field span-2"><span>Full name</span><Input value={account.fullName} onChange={(event) => setField('fullName', event.target.value)} autoComplete="name" required /></label>
            <label className="form-field"><span>Position</span><Input value={account.position} onChange={(event) => setField('position', event.target.value)} placeholder="Yearbook administrator" /></label>
            <label className="form-field"><span>Phone</span><Input value={account.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="Optional contact number" autoComplete="tel" /></label>
            <label className="form-field span-2"><span>About</span><textarea className="field account-bio" value={account.bio} onChange={(event) => setField('bio', event.target.value)} placeholder="Briefly describe your role in GradBook." maxLength={280} /><small>{account.bio.length}/280 characters</small></label>
          </div>
          <div className="form-actions system-form-actions"><Button type="submit" disabled={profileSaving}><Save size={16} /> {profileSaving ? 'Saving…' : 'Save profile'}</Button></div>
        </form>}
      </Card>

      <div className="system-info-stack">
        <Card className="panel-card account-email-card"><span><Mail size={19} /></span><div><small>Sign-in email</small><strong>{user?.email || 'Not available'}</strong><p>Your authenticated email cannot be changed from this profile.</p></div></Card>
        <Card className="panel-card password-card">
          <div className="system-card-heading"><span><KeyRound size={19} /></span><div><h3>Change password</h3><p>Confirm your current password before setting a new one.</p></div></div>
          <form onSubmit={savePassword}>
            <label className="form-field"><span>Current password</span><Input type="password" value={password.current} onChange={(event) => setPassword((current) => ({ ...current, current: event.target.value }))} autoComplete="current-password" required /></label>
            <label className="form-field"><span>New password</span><Input type="password" minLength={8} value={password.next} onChange={(event) => setPassword((current) => ({ ...current, next: event.target.value }))} autoComplete="new-password" required /></label>
            <label className="form-field"><span>Confirm new password</span><Input type="password" minLength={8} value={password.confirm} onChange={(event) => setPassword((current) => ({ ...current, confirm: event.target.value }))} autoComplete="new-password" required /></label>
            <div className="form-actions"><Button type="submit" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Update password'}</Button></div>
          </form>
        </Card>
      </div>
    </div>
  </div>
}
