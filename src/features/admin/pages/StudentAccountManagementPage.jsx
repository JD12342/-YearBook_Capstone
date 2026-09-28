import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Pencil, Search, UserRound, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { getStudentAccounts, updateStudentAccountAssignment } from '../services/accountManagementService.js'
import { getSchoolYears, getSections, getStrands } from '../services/schoolYearService.js'

const emptyAccount = { uid: '', fullName: '', email: '', lrn: '', accountStatus: 'disabled', schoolYearId: '', strandId: '', sectionId: '', isAlumniLeader: false, leaderSectionId: '', photoLimit: 5, videoLimit: 2, videoDurationLimitSeconds: 120 }

export function StudentAccountManagementPage({ embedded = false, leadersOnly = false }) {
  const [accounts, setAccounts] = useState([])
  const [schoolYears, setSchoolYears] = useState([])
  const [strands, setStrands] = useState([])
  const [sections, setSections] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [editingAccount, setEditingAccount] = useState(null)
  const [form, setForm] = useState(emptyAccount)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [nextAccounts, nextYears, nextStrands, nextSections] = await Promise.all([getStudentAccounts(), getSchoolYears(), getStrands(), getSections()])
      setAccounts(nextAccounts)
      setSchoolYears(nextYears)
      setStrands(nextStrands)
      setSections(nextSections)
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Unable to load student accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  const visibleAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return accounts.filter((account) => {
      if (leadersOnly && !account.isAlumniLeader) return false
      if (status !== 'all' && account.accountStatus !== status) return false
      return !term || [account.fullName, account.email, account.lrn].join(' ').toLowerCase().includes(term)
    })
  }, [accounts, leadersOnly, search, status])

  const yearLabels = useMemo(() => new Map(schoolYears.map((item) => [item.id, item.name])), [schoolYears])
  const strandLabels = useMemo(() => new Map(strands.map((item) => [item.id, item.code || item.name])), [strands])
  const sectionLabels = useMemo(() => new Map(sections.map((item) => [item.id, item.code || item.name])), [sections])
  const formStrands = strands.filter((item) => !form.schoolYearId || item.schoolYearId === form.schoolYearId)
  const formSections = sections.filter((item) => (!form.schoolYearId || item.schoolYearId === form.schoolYearId) && (!form.strandId || item.strandId === form.strandId))

  const openAccount = (account) => {
    setEditingAccount(account)
    setForm({ ...emptyAccount, ...account })
    setError('')
  }

  const closeAccount = () => {
    setEditingAccount(null)
    setForm(emptyAccount)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (form.accountStatus === 'active' && (!form.schoolYearId || !form.strandId || !form.sectionId)) {
      setError('Choose a school year, strand, and section before activating this student account.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateStudentAccountAssignment(form)
      setMessage(`${form.fullName || 'Student'} account updated${form.isAlumniLeader ? ' as the section alumni leader' : ''}.`)
      closeAccount()
      await load()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update this student account.')
    } finally {
      setSaving(false)
    }
  }

  return <div className={`page-stack student-account-management ${embedded ? 'is-embedded-directory' : ''}`}>
    {!embedded && <div className="page-header-row"><div><div className="page-kicker">Account access</div><h2>{leadersOnly ? 'Alumni leader accounts' : 'Student accounts'}</h2><p className="page-description">Manage student login access and academic placement independently from graduation records.</p></div></div>}
    {message && <div className="form-success" role="status">{message}</div>}
    {error && !editingAccount && <div className="form-error" role="alert">{error}</div>}

    <Card className="toolbar-card">
      <div className="data-toolbar-row teacher-directory-toolbar">
        <label className="search-wrap"><Search size={16} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={leadersOnly ? 'Search alumni leader name, email, or LRN' : 'Search student name, email, or LRN'} /></label>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All accounts</option><option value="active">Active</option><option value="disabled">Disabled</option></Select>
      </div>
    </Card>

    <Card className="panel-card teacher-directory-table">
      {loading ? <div className="empty-state">Loading student accounts…</div> : visibleAccounts.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Student account</th><th>LRN</th><th>Account type</th><th>Assignment</th><th>School year</th><th>Strand</th><th>Section</th><th>Memory limits</th><th>Account</th><th>Actions</th></tr></thead><tbody>
        {visibleAccounts.map((account) => {
          const assigned = Boolean(account.schoolYearId && account.strandId && account.sectionId)
          return <tr key={account.uid}>
            <td><div className="account-name-cell"><span className="student-avatar-small"><UserRound size={23} /></span><span><strong>{account.fullName}</strong><small className="table-subtext">{account.email}</small></span></div></td>
            <td>{account.lrn || '—'}</td>
            <td><Badge status={account.isAlumniLeader ? 'approved' : 'pending'}>{account.isAlumniLeader ? 'Alumni leader' : 'Student'}</Badge></td>
            <td><Badge className="teacher-assignment-badge" status={assigned ? 'approved' : 'editing'}>{assigned ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{assigned ? 'Assigned' : 'No section assigned'}</Badge></td>
            <td>{yearLabels.get(account.schoolYearId) || 'Not assigned'}</td>
            <td>{strandLabels.get(account.strandId) || 'Not assigned'}</td>
            <td>{sectionLabels.get(account.sectionId) || 'Not assigned'}</td>
            <td>{account.isAlumniLeader ? <span className="memory-limit-summary">{account.photoLimit || 5} photos · {account.videoLimit || 2} videos · {Math.max(Math.round((account.videoDurationLimitSeconds || 120) / 60), 1)} min/video</span> : '—'}</td>
            <td><Badge status={account.accountStatus || 'disabled'}>{account.accountStatus || 'disabled'}</Badge></td>
            <td><Button size="sm" variant="secondary" onClick={() => openAccount(account)}><Pencil size={14} /> Manage</Button></td>
          </tr>
        })}
      </tbody></table></div> : <div className="empty-state"><UsersRound size={30} /><div className="empty-state-title">{leadersOnly ? 'No alumni leaders assigned' : 'No student accounts'}</div><div>{leadersOnly ? 'Assign an eligible student account as the alumni leader for a section.' : 'Approved student registration accounts will appear here.'}</div></div>}
    </Card>

    <Modal isOpen={Boolean(editingAccount)} title="Manage student account" onClose={closeAccount} panelClassName="teacher-directory-modal">
      <form className="student-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="teacher-account-summary"><UserRound size={22} /><div><strong>{form.fullName}</strong><span>{form.email} · {form.lrn || 'No LRN'}</span></div></div>
        <div className="field-grid">
          <label className="form-field span-2"><span>Account status</span><Select value={form.accountStatus} onChange={(event) => setForm((current) => ({ ...current, accountStatus: event.target.value }))}><option value="active">Active</option><option value="disabled">Disabled</option></Select><small className="teacher-field-help">Active allows sign-in; Disabled blocks student access.</small></label>
          <label className="form-field span-2"><span>Memory contributor access</span><Select value={form.isAlumniLeader ? 'leader' : 'student'} onChange={(event) => setForm((current) => ({ ...current, isAlumniLeader: event.target.value === 'leader' }))}><option value="student">Regular student</option><option value="leader">Alumni leader</option></Select><small className="teacher-field-help">An alumni leader can submit memories for one assigned section and remains listed under Student Accounts.</small></label>
          <label className="form-field"><span>School year</span><Select value={form.schoolYearId} onChange={(event) => setForm((current) => ({ ...current, schoolYearId: event.target.value, strandId: '', sectionId: '' }))}><option value="">Choose school year</option>{schoolYears.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
          <label className="form-field"><span>Strand</span><Select value={form.strandId} onChange={(event) => setForm((current) => ({ ...current, strandId: event.target.value, sectionId: '' }))}><option value="">Choose strand</option>{formStrands.map((item) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}</Select></label>
          <label className="form-field span-2"><span>Section</span><Select value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))}><option value="">Choose section</option>{formSections.map((item) => <option key={item.id} value={item.id}>{item.code || item.name}</option>)}</Select></label>
          {form.isAlumniLeader && <fieldset className="teacher-form-sections span-2"><legend>Memory upload limits</legend><p>This alumni leader represents only the selected section. Set the media counts and maximum duration of each video.</p><div className="teacher-limit-grid"><label><span>Photo uploads</span><Input type="number" min="1" max="500" value={form.photoLimit} onChange={(event) => setForm((current) => ({ ...current, photoLimit: event.target.value }))} /></label><label><span>Video uploads</span><Input type="number" min="1" max="100" value={form.videoLimit} onChange={(event) => setForm((current) => ({ ...current, videoLimit: event.target.value }))} /></label><label><span>Maximum minutes per video</span><Input type="number" min="1" max="60" value={Math.max(Math.round((Number(form.videoDurationLimitSeconds) || 120) / 60), 1)} onChange={(event) => setForm((current) => ({ ...current, videoDurationLimitSeconds: Math.max(Number(event.target.value) || 1, 1) * 60 }))} /></label></div></fieldset>}
        </div>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={closeAccount}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving account…' : 'Save account'}</Button></div>
      </form>
    </Modal>
  </div>
}
