import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Pencil, Search, UserRound, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { getSchoolYears } from '../services/schoolYearService.js'
import { getSections } from '../services/sectionService.js'
import { getTeacherAccounts, teacherDisplayName, updateTeacherAccountAssignment } from '../services/teacherDirectoryService.js'

const emptyAssignment = { uid: '', fullName: '', email: '', teacherNumber: '', position: 'Teacher', schoolYearId: '', sectionIds: [], accountStatus: 'active', photoLimit: 5, videoLimit: 2, videoDurationLimitSeconds: 120 }

export function TeacherAccountManagementPage({ embedded = false }) {
  const [teachers, setTeachers] = useState([])
  const [schoolYears, setSchoolYears] = useState([])
  const [sections, setSections] = useState([])
  const [query, setQuery] = useState('')
  const [schoolYearId, setSchoolYearId] = useState('')
  const [status, setStatus] = useState('all')
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [form, setForm] = useState(emptyAssignment)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [nextTeachers, nextYears, nextSections] = await Promise.all([getTeacherAccounts(), getSchoolYears(), getSections()])
      setTeachers(nextTeachers)
      setSchoolYears(nextYears)
      setSections(nextSections)
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Unable to load approved teacher accounts.')
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

  const visibleTeachers = useMemo(() => {
    const term = query.trim().toLowerCase()
    return teachers.filter((teacher) => {
      if (schoolYearId && teacher.schoolYearId !== schoolYearId) return false
      if (status !== 'all' && teacher.accountStatus !== status) return false
      return !term || [teacher.fullName, teacher.email, teacher.teacherNumber, teacher.position].join(' ').toLowerCase().includes(term)
    })
  }, [teachers, query, schoolYearId, status])

  const yearLabels = useMemo(() => new Map(schoolYears.map((year) => [year.id, year.name])), [schoolYears])
  const sectionLabels = useMemo(() => new Map(sections.map((section) => [section.id, section.code || section.name])), [sections])
  const formSections = sections.filter((section) => section.schoolYearId === form.schoolYearId)

  const openAssignment = (teacher) => {
    setForm({ ...emptyAssignment, ...teacher, sectionIds: teacher.sectionIds || [], accountStatus: teacher.accountStatus || 'disabled' })
    setEditingTeacher(teacher)
    setError('')
  }

  const closeAssignment = () => {
    setEditingTeacher(null)
    setForm(emptyAssignment)
    setError('')
  }

  const toggleSection = (sectionId) => setForm((current) => ({ ...current, sectionIds: current.sectionIds.includes(sectionId) ? current.sectionIds.filter((id) => id !== sectionId) : [...current.sectionIds, sectionId] }))

  const submit = async (event) => {
    event.preventDefault()
    if (form.accountStatus === 'active' && (!form.schoolYearId || !form.sectionIds.length)) {
      setError('Choose a school year and at least one section for this teacher.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateTeacherAccountAssignment(form)
      setMessage(`${form.fullName || 'Teacher'} account and section assignment updated.`)
      closeAssignment()
      await load()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update this teacher account.')
    } finally {
      setSaving(false)
    }
  }

  return <div className={`page-stack teacher-management-page ${embedded ? 'is-embedded-directory' : ''}`}>
    {!embedded && <div className="page-header-row"><div><div className="page-kicker">Account access</div><h2>Teacher accounts</h2><p className="page-description">Manage teacher sign-in access and the sections available in Teacher Studio.</p></div></div>}

    {message && <div className="form-success" role="status">{message}</div>}
    {error && !editingTeacher && <div className="form-error" role="alert">{error}</div>}

    <Card className="toolbar-card">
      <div className="data-toolbar-row teacher-directory-toolbar">
        <label className="search-wrap"><Search size={16} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teacher name, account email, or Teacher ID" /></label>
        <Select value={schoolYearId} onChange={(event) => setSchoolYearId(event.target.value)}><option value="">All school years</option>{schoolYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All accounts</option><option value="active">Active</option><option value="disabled">Disabled</option></Select>
      </div>
    </Card>

    <Card className="panel-card teacher-directory-table">
      {loading ? <div className="empty-state">Loading teacher accounts…</div> : visibleTeachers.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Teacher account</th><th>Teacher ID</th><th>Assignment</th><th>School year</th><th>Assigned sections</th><th>Memory limits</th><th>Account</th><th>Actions</th></tr></thead><tbody>
        {visibleTeachers.map((teacher) => {
          const hasSectionAssignment = Boolean(teacher.schoolYearId && teacher.sectionIds?.length)
          return <tr key={teacher.id}>
            <td><strong>{teacher.fullName || teacherDisplayName(teacher) || 'Unnamed teacher'}</strong><small className="table-subtext">{teacher.email}</small></td>
            <td>{teacher.teacherNumber || '—'}</td>
            <td><Badge className="teacher-assignment-badge" status={hasSectionAssignment ? 'approved' : 'editing'}>{hasSectionAssignment ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}{hasSectionAssignment ? 'Assigned' : 'No section assigned'}</Badge></td>
            <td>{yearLabels.get(teacher.schoolYearId) || 'Not assigned'}</td>
            <td>{(teacher.sectionIds || []).map((id) => sectionLabels.get(id)).filter(Boolean).join(', ') || 'Not assigned'}</td>
            <td><span className="memory-limit-summary">{teacher.photoLimit || 5} photos · {teacher.videoLimit || 2} videos · {Math.max(Math.round((teacher.videoDurationLimitSeconds || 120) / 60), 1)} min/video</span></td>
            <td><span className={`report-status report-status-${teacher.accountStatus || 'disabled'}`}>{teacher.accountStatus || 'disabled'}</span></td>
            <td><div className="inline-actions"><Button size="sm" variant="secondary" onClick={() => openAssignment(teacher)}><Pencil size={14} /> Manage</Button></div></td>
          </tr>
        })}
      </tbody></table></div> : <div className="empty-state"><UsersRound size={30} /><div className="empty-state-title">No approved teacher accounts</div><div>Teacher registration accounts will appear here after approval.</div></div>}
    </Card>

    <Modal isOpen={Boolean(editingTeacher)} title="Assign teacher account" onClose={closeAssignment} panelClassName="teacher-directory-modal">
      <form className="student-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="teacher-account-summary"><UserRound size={22} /><div><strong>{form.fullName}</strong><span>{form.email} · {form.teacherNumber || 'No Teacher ID'}</span></div></div>
        <div className="field-grid">
          <label className="form-field"><span>Position</span><Input value={form.position || ''} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} placeholder="Subject teacher, adviser…" /><small className="teacher-field-help">The teacher’s title or responsibility in the school.</small></label>
          <label className="form-field"><span>Account status</span><Select value={form.accountStatus} onChange={(event) => setForm((current) => ({ ...current, accountStatus: event.target.value }))}><option value="active">Active</option><option value="disabled">Disabled</option></Select><small className="teacher-field-help">Active allows sign-in; Disabled blocks Teacher Studio access.</small></label>
          <label className="form-field span-2"><span>School year</span><Select value={form.schoolYearId} onChange={(event) => setForm((current) => ({ ...current, schoolYearId: event.target.value, sectionIds: [] }))}><option value="">Choose school year</option>{schoolYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select></label>
          <fieldset className="teacher-form-sections span-2"><legend>Assigned sections</legend><p>Select every section this teacher handles. These assignments control Teacher Studio uploads and yearbook participation.</p><div>{formSections.map((section) => <label key={section.id}><input type="checkbox" checked={form.sectionIds.includes(section.id)} onChange={() => toggleSection(section.id)} /><span>{section.code || section.name || 'Unnamed section'}</span></label>)}</div>{form.schoolYearId && !formSections.length && <small>No sections exist for this school year yet.</small>}</fieldset>
          <fieldset className="teacher-form-sections span-2"><legend>Memory upload limits</legend><p>Set how many photos and videos this teacher can upload and the maximum duration of each video.</p><div className="teacher-limit-grid"><label><span>Photo uploads</span><Input type="number" min="1" max="500" value={form.photoLimit} onChange={(event) => setForm((current) => ({ ...current, photoLimit: event.target.value }))} /></label><label><span>Video uploads</span><Input type="number" min="1" max="100" value={form.videoLimit} onChange={(event) => setForm((current) => ({ ...current, videoLimit: event.target.value }))} /></label><label><span>Maximum minutes per video</span><Input type="number" min="1" max="60" value={Math.max(Math.round((Number(form.videoDurationLimitSeconds) || 120) / 60), 1)} onChange={(event) => setForm((current) => ({ ...current, videoDurationLimitSeconds: Math.max(Number(event.target.value) || 1, 1) * 60 }))} /></label></div></fieldset>
        </div>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={closeAssignment}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving assignment…' : 'Save assignment'}</Button></div>
      </form>
    </Modal>
  </div>
}
