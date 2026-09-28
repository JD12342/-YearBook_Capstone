import { useEffect, useMemo, useState } from 'react'
import { Archive, Camera, Pencil, Plus, RotateCcw, Search, Trash2, UserRound, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { DeleteConfirmationModal } from '../components/ui/DeleteConfirmationModal.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { reauthenticateAdmin } from '../services/firebase/auth.js'
import { getSchoolYears } from '../services/schoolYearService.js'
import { getSections } from '../services/sectionService.js'
import { createTeacher, deleteTeacher, getTeachers, setTeacherStatus, teacherDisplayName, updateTeacher } from '../services/teacherDirectoryService.js'

const emptyTeacher = { firstName: '', middleName: '', lastName: '', suffix: '', teacherNumber: '', position: '', schoolYearId: '', sectionIds: [], status: 'active' }

export function TeacherManagementPage({ embedded = false }) {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [schoolYears, setSchoolYears] = useState([])
  const [sections, setSections] = useState([])
  const [query, setQuery] = useState('')
  const [schoolYearId, setSchoolYearId] = useState('')
  const [status, setStatus] = useState('active')
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyTeacher)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [nextTeachers, nextYears, nextSections] = await Promise.all([getTeachers(), getSchoolYears(), getSections()])
      setTeachers(nextTeachers)
      setSchoolYears(nextYears)
      setSections(nextSections)
      setSchoolYearId((current) => current || nextYears[0]?.id || '')
      setError('')
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the teacher directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visibleTeachers = useMemo(() => {
    const term = query.trim().toLowerCase()
    return teachers.filter((teacher) => {
      if (schoolYearId && teacher.schoolYearId !== schoolYearId) return false
      if (status !== 'all' && teacher.status !== status) return false
      return !term || [teacherDisplayName(teacher), teacher.teacherNumber, teacher.position].join(' ').toLowerCase().includes(term)
    })
  }, [teachers, query, schoolYearId, status])

  const yearLabels = useMemo(() => new Map(schoolYears.map((year) => [year.id, year.name])), [schoolYears])
  const sectionLabels = useMemo(() => new Map(sections.map((section) => [section.id, section.code || section.name])), [sections])
  const formSections = sections.filter((section) => section.schoolYearId === form.schoolYearId)

  const openForm = (teacher = null) => {
    setEditingTeacher(teacher)
    setForm(teacher ? { ...emptyTeacher, ...teacher, sectionIds: teacher.sectionIds || [] } : { ...emptyTeacher, schoolYearId: schoolYearId || schoolYears[0]?.id || '' })
    setError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingTeacher(null)
    setForm(emptyTeacher)
    setError('')
    setIsFormOpen(false)
  }

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const toggleSection = (sectionId) => setForm((current) => ({ ...current, sectionIds: current.sectionIds.includes(sectionId) ? current.sectionIds.filter((id) => id !== sectionId) : [...current.sectionIds, sectionId] }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingTeacher?.id) await updateTeacher(editingTeacher.id, form)
      else await createTeacher(form)
      setMessage(editingTeacher ? 'Teacher record updated.' : 'Teacher added to the graduation-photo directory.')
      closeForm()
      await load()
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this teacher.')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (teacher, nextStatus) => {
    setError('')
    try {
      await setTeacherStatus(teacher.id, nextStatus)
      setMessage(nextStatus === 'archived' ? 'Teacher archived.' : 'Teacher restored to the photo directory.')
      await load()
    } catch (statusError) {
      setError(statusError.message || 'Unable to update this teacher.')
    }
  }

  const confirmDelete = async (password) => {
    if (!pendingDelete) return
    await reauthenticateAdmin(password)
    await deleteTeacher(pendingDelete.id)
    setPendingDelete(null)
    setMessage('Teacher permanently removed.')
    await load()
  }

  const startPhotoSession = (teacher) => navigate(`/photos/camera?subject=teacher&teacherId=${encodeURIComponent(teacher.id)}&schoolYearId=${encodeURIComponent(teacher.schoolYearId)}`)

  return <div className={`page-stack teacher-management-page ${embedded ? 'is-embedded-directory' : ''}`}>
    {!embedded && <div className="page-header-row">
      <div><div className="page-kicker">Graduation portraits</div><h2>Teacher directory</h2><p className="page-description">Add the teachers who will join the graduating classes, then photograph them in the same portrait session used for students.</p></div>
      <Button type="button" onClick={() => openForm()}><Plus size={17} /> Add teacher</Button>
    </div>}

    {embedded && <div className="directory-action-row"><div><strong>Teacher graduation records</strong><small>Add teachers manually, assign their graduation batch, and capture their portraits.</small></div><Button type="button" onClick={() => openForm()}><Plus size={17} /> Add teacher</Button></div>}

    {message && <div className="form-success" role="status">{message}</div>}
    {error && !isFormOpen && <div className="form-error" role="alert">{error}</div>}

    <Card className="toolbar-card">
      <div className="data-toolbar-row teacher-directory-toolbar">
        <label className="search-wrap"><Search size={16} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teacher name, ID, or position" /></label>
        <Select value={schoolYearId} onChange={(event) => setSchoolYearId(event.target.value)}><option value="">All school years</option>{schoolYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All statuses</option></Select>
      </div>
    </Card>

    <Card className="panel-card teacher-directory-table">
      {loading ? <div className="empty-state">Loading teachers…</div> : visibleTeachers.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Photo</th><th>Teacher</th><th>Teacher ID</th><th>School year</th><th>Position</th><th>Assigned classes</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {visibleTeachers.map((teacher) => <tr key={teacher.id}>
          <td><div className="student-photo-cell">{teacher.portraitUrl ? <img className="student-photo-thumb" src={teacher.portraitUrl} alt={teacherDisplayName(teacher)} /> : <span className="student-avatar-small"><UserRound size={25} /></span>}</div></td>
          <td><strong>{teacherDisplayName(teacher) || 'Unnamed teacher'}</strong></td>
          <td>{teacher.teacherNumber || '—'}</td>
          <td>{yearLabels.get(teacher.schoolYearId) || '—'}</td>
          <td>{teacher.position || 'Teacher'}</td>
          <td>{(teacher.sectionIds || []).map((id) => sectionLabels.get(id)).filter(Boolean).join(', ') || 'Faculty'}</td>
          <td><span className={`report-status report-status-${teacher.status || 'active'}`}>{teacher.status || 'active'}</span></td>
          <td><div className="inline-actions"><Button size="sm" onClick={() => startPhotoSession(teacher)}><Camera size={14} /> {teacher.portraitUrl ? 'Retake' : 'Photo'}</Button><Button size="sm" variant="secondary" onClick={() => openForm(teacher)}><Pencil size={14} /> Edit</Button>{teacher.status === 'archived' ? <Button size="sm" variant="secondary" onClick={() => changeStatus(teacher, 'active')}><RotateCcw size={14} /> Restore</Button> : <Button size="sm" variant="secondary" onClick={() => changeStatus(teacher, 'archived')}><Archive size={14} /> Archive</Button>}<Button size="sm" variant="danger" onClick={() => setPendingDelete(teacher)}><Trash2 size={14} /> Delete</Button></div></td>
        </tr>)}
      </tbody></table></div> : <div className="empty-state"><UsersRound size={30} /><div className="empty-state-title">No teachers found</div><div>Add teachers here before starting their graduation portrait session.</div></div>}
    </Card>

    <Modal isOpen={isFormOpen} title={editingTeacher ? 'Edit teacher' : 'Add teacher'} onClose={closeForm} panelClassName="teacher-directory-modal">
      <form className="student-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field-grid">
          <label className="form-field"><span>First name</span><Input required value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} /></label>
          <label className="form-field"><span>Middle name</span><Input value={form.middleName} onChange={(event) => setField('middleName', event.target.value)} placeholder="Optional" /></label>
          <label className="form-field"><span>Last name</span><Input required value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} /></label>
          <label className="form-field"><span>Suffix</span><Input value={form.suffix} onChange={(event) => setField('suffix', event.target.value)} placeholder="Optional" /></label>
          <label className="form-field"><span>Teacher ID</span><Input value={form.teacherNumber} onChange={(event) => setField('teacherNumber', event.target.value)} placeholder="Optional school ID" /></label>
          <label className="form-field"><span>Position</span><Input value={form.position} onChange={(event) => setField('position', event.target.value)} placeholder="Subject teacher, adviser…" /></label>
          <label className="form-field"><span>School year</span><Select required value={form.schoolYearId} onChange={(event) => setForm((current) => ({ ...current, schoolYearId: event.target.value, sectionIds: [] }))}><option value="">Choose school year</option>{schoolYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</Select></label>
          <label className="form-field"><span>Status</span><Select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="active">Active</option><option value="archived">Archived</option></Select></label>
          <fieldset className="teacher-form-sections span-2"><legend>Classes included in the graduation batch</legend><p>Select every class this teacher should appear with. This is optional for faculty-only portraits.</p><div>{formSections.map((section) => <label key={section.id}><input type="checkbox" checked={form.sectionIds.includes(section.id)} onChange={() => toggleSection(section.id)} /><span>{section.code || section.name || 'Unnamed section'}</span></label>)}</div></fieldset>
        </div>
        <div className="form-actions"><Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingTeacher ? 'Update teacher' : 'Add teacher'}</Button></div>
      </form>
    </Modal>

    <DeleteConfirmationModal isOpen={Boolean(pendingDelete)} title="Delete teacher?" message={`This will permanently remove ${pendingDelete ? teacherDisplayName(pendingDelete) : 'this teacher'} and their saved portrait from the directory.`} warning="This cannot be undone. Confirm with your administrator password." onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} />
  </div>
}
