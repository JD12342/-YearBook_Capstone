import { useEffect, useState } from 'react'
import { CheckCircle2, Database, Gauge, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Select } from '../components/ui/Select.jsx'
import {
  defaultAdminPreferences,
  loadAdminPreferences,
  restoreDefaultAdminPreferences,
  saveAdminPreferences,
} from '../services/accountSettingsService.js'

function ToggleSetting({ checked, onChange, title, description }) {
  return <label className="settings-toggle-row">
    <span><strong>{title}</strong><small>{description}</small></span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <i aria-hidden="true" />
  </label>
}

export function SettingsPage() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(defaultAdminPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    loadAdminPreferences(user?.uid).then((values) => {
      if (active) setPreferences(values)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user?.uid])

  const update = (field, value) => setPreferences((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      setPreferences(await saveAdminPreferences(user?.uid, preferences))
      setSuccess('Workspace preferences saved and applied.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const restore = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      setPreferences(await restoreDefaultAdminPreferences(user?.uid))
      setSuccess('Default workspace preferences restored.')
    } catch (restoreError) {
      setError(restoreError.message || 'Unable to restore settings.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="page-stack system-page">
    <div className="page-header-row">
      <div><div className="page-kicker">System</div><h2>Settings</h2><p className="page-description">Personalize the administrator workspace. Preferences sync to your GradBook account.</p></div>
    </div>

    {success && <div className="form-success" role="status"><CheckCircle2 size={17} /> {success}</div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    <div className="system-page-grid">
      <Card className="panel-card system-form-card">
        <div className="system-card-heading"><span><SlidersHorizontal size={19} /></span><div><h3>Workspace preferences</h3><p>These changes affect your administrator account only.</p></div></div>
        {loading ? <div className="empty-state">Loading your preferences…</div> : <form onSubmit={save}>
          <div className="settings-select-grid">
            <label className="form-field"><span>Interface density</span><Select value={preferences.density} onChange={(event) => update('density', event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></Select><small>Compact mode reduces card and table spacing.</small></label>
            <label className="form-field"><span>Default sidebar</span><Select value={preferences.sidebarDefault} onChange={(event) => update('sidebarDefault', event.target.value)}><option value="expanded">Expanded</option><option value="collapsed">Collapsed</option></Select><small>Applied when the administrator workspace opens.</small></label>
            <label className="form-field"><span>Reports period</span><Select value={preferences.defaultReportPeriod} onChange={(event) => update('defaultReportPeriod', Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></Select><small>Default database analytics date range.</small></label>
          </div>
          <div className="settings-toggle-list">
            <ToggleSetting checked={preferences.reduceMotion} onChange={(value) => update('reduceMotion', value)} title="Reduce interface motion" description="Disables decorative transitions and animations." />
            <ToggleSetting checked={preferences.showPageHelp} onChange={(value) => update('showPageHelp', value)} title="Show page help" description="Keeps the contextual help button visible on administrator pages." />
          </div>
          <div className="form-actions system-form-actions"><Button type="button" variant="secondary" onClick={restore} disabled={saving}><RotateCcw size={16} /> Restore defaults</Button><Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save settings'}</Button></div>
        </form>}
      </Card>

      <div className="system-info-stack">
        <Card className="panel-card system-info-card"><span><ShieldCheck size={20} /></span><div><h3>Administrator security</h3><p>Settings are stored in your protected Firebase user record. Only an administrator can modify them.</p></div></Card>
        <Card className="panel-card system-info-card"><span><Database size={20} /></span><div><h3>Firebase project</h3><p>{import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Firebase is not configured'}</p></div></Card>
        <Card className="panel-card system-info-card"><span><Gauge size={20} /></span><div><h3>Database analytics</h3><p>Usage and billing configuration is available from the Reports page.</p><a href="/reports">Open Reports</a></div></Card>
      </div>
    </div>
  </div>
}
