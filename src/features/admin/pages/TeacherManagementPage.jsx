import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenCheck, ImageUp, Save, Search, ShieldCheck, UserCog } from 'lucide-react'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { getSections } from '../services/sectionService.js'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../services/firebase/firestore.js'
import { getTeachers, manageTeacher, uploadTeacherPortrait } from '../../teacher/services/teacherService.js'
import { syncYearbookForSchoolYear } from '../services/yearbookService.js'

const defaults = { sectionIds: [], schoolYearId: '', photoLimit: 40, videoLimit: 5, photosSubmitted: 0, videosSubmitted: 0, pendingPostLimit: 10, active: true }

export function TeacherManagementPage() {
  const portraitInputRef = useRef(null)
  const [teachers, setTeachers] = useState([])
  const [sections, setSections] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [assignment, setAssignment] = useState(defaults)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPortrait, setSavingPortrait] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try { const [nextTeachers, nextSections] = await Promise.all([getTeachers(), getSections()]); setTeachers(nextTeachers); setSections(nextSections); setSelectedId((current) => current || nextTeachers[0]?.id || '') }
    catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (!selectedId) return; getDoc(doc(db, 'teacherAssignments', selectedId)).then((snapshot) => setAssignment({ ...defaults, ...(snapshot.data() || {}) })).catch(() => setAssignment(defaults)) }, [selectedId])

  const visible = useMemo(() => teachers.filter((teacher) => `${teacher.fullName} ${teacher.email} ${teacher.referenceId}`.toLowerCase().includes(query.toLowerCase())), [teachers, query])
  const selected = teachers.find((teacher) => teacher.id === selectedId)
  const toggleSection = (id) => setAssignment((current) => ({ ...current, sectionIds: current.sectionIds.includes(id) ? current.sectionIds.filter((item) => item !== id) : [...current.sectionIds, id] }))
  const save = async () => {
    if (!selected) return
    setSaving(true); setError(''); setMessage('')
    try {
      const selectedSections = sections.filter((section) => assignment.sectionIds.includes(section.id))
      const years = [...new Set(selectedSections.map((section) => section.schoolYearId).filter(Boolean))]
      await manageTeacher({ uid: selected.id, role: 'Teacher', ...assignment, schoolYearId: years.length === 1 ? years[0] : '' })
      await Promise.all(years.map(syncYearbookForSchoolYear))
      setMessage(`${selected.fullName || selected.email} was updated.`)
      await load()
    }
    catch (saveError) { setError(saveError.message || 'Unable to update this teacher.') } finally { setSaving(false) }
  }

  const savePortrait = async (file) => {
    if (!selected || !file) return
    setSavingPortrait(true); setError(''); setMessage('')
    try {
      await uploadTeacherPortrait({ uid: selected.id, file })
      const years = [...new Set(sections.filter((section) => assignment.sectionIds.includes(section.id)).map((section) => section.schoolYearId).filter(Boolean))]
      await Promise.all(years.map(syncYearbookForSchoolYear))
      setMessage(`${selected.fullName || selected.email}'s approved portrait was added to the 3D yearbook.`)
      await load()
    } catch (portraitError) { setError(portraitError.message || 'Unable to save the teacher portrait.') }
    finally { setSavingPortrait(false); if (portraitInputRef.current) portraitInputRef.current.value = '' }
  }

  const resetUsage = async () => {
    if (!selected || !window.confirm(`Reset ${selected.fullName || selected.email}'s used photo and video allowance to zero?`)) return
    setSaving(true); setError(''); setMessage('')
    try {
      await manageTeacher({ uid: selected.id, role: 'Teacher', ...assignment, resetUsage: true })
      setAssignment((current) => ({ ...current, photosSubmitted: 0, videosSubmitted: 0 }))
      setMessage('The teacher upload allowance was reset.')
    } catch (resetError) { setError(resetError.message || 'Unable to reset this allowance.') }
    finally { setSaving(false) }
  }

  return <div className="page-stack teacher-management-page">
    <div className="page-header-row"><div><div className="page-kicker">Access and assignments</div><h2>Teacher management</h2><p className="page-description">Assign class sections, upload allowances, and graduation-photo access.</p></div><div className="teacher-security-note"><ShieldCheck size={18} /><span>Teachers can submit; only administrators approve.</span></div></div>
    {message && <div className="form-success">{message}</div>}{error && <div className="form-error">{error}</div>}
    <div className="teacher-management-grid">
      <Card className="panel-card teacher-directory"><label className="teacher-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers" /></label>{loading ? <div className="empty-state">Loading teachers…</div> : visible.length ? visible.map((teacher) => <button key={teacher.id} type="button" className={teacher.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(teacher.id)}><span><strong>{teacher.fullName || 'Unnamed teacher'}</strong><small>{teacher.email || teacher.referenceId}</small></span><em>{teacher.status}</em></button>) : <div className="empty-state">No approved teachers yet.</div>}</Card>
      <Card className="panel-card teacher-assignment-card">
        {selected ? <><header>{selected.portraitUrl ? <img className="teacher-admin-portrait" src={selected.portraitUrl} alt={`Approved portrait of ${selected.fullName || 'teacher'}`} /> : <span><UserCog size={19} /></span>}<div><small>SELECTED TEACHER</small><h3>{selected.fullName || selected.email}</h3><p>{selected.referenceId || 'No employee number'}</p></div><label className="teacher-active-toggle"><input type="checkbox" checked={assignment.active} onChange={(event) => setAssignment((current) => ({ ...current, active: event.target.checked }))} /><span>Active</span></label></header>
          <section className="teacher-portrait-control"><div><strong>Administrator-approved yearbook portrait</strong><p>Take the teacher's graduation-style photo, then upload the final portrait here. Only the administrator can replace it.</p></div><input ref={portraitInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => savePortrait(event.target.files?.[0])} /><Button type="button" variant="secondary" disabled={savingPortrait} onClick={() => portraitInputRef.current?.click()}><ImageUp size={16} />{savingPortrait ? 'Uploading…' : selected.portraitUrl ? 'Replace portrait' : 'Take / upload portrait'}</Button></section>
          <section><div className="teacher-section-heading"><div><strong>Assigned class sections</strong><p>Controls which class memories this teacher may submit for administrator approval.</p></div><BookOpenCheck size={19} /></div><div className="teacher-section-options">{sections.map((section) => <label key={section.id}><input type="checkbox" checked={assignment.sectionIds.includes(section.id)} onChange={() => toggleSection(section.id)} /><span><strong>{section.name || section.id}</strong><small>{section.schoolYearName || section.schoolYearId || 'School section'}</small></span></label>)}</div></section>
          <section className="teacher-limit-grid"><label><span>Total photo allowance</span><input type="number" min="1" max="500" value={assignment.photoLimit} onChange={(event) => setAssignment((current) => ({ ...current, photoLimit: Number(event.target.value) }))} /><small>{assignment.photosSubmitted || 0} already submitted</small></label><label><span>Total video allowance</span><input type="number" min="1" max="100" value={assignment.videoLimit} onChange={(event) => setAssignment((current) => ({ ...current, videoLimit: Number(event.target.value) }))} /><small>{assignment.videosSubmitted || 0} already submitted</small></label><label><span>Maximum pending posts</span><input type="number" min="1" max="100" value={assignment.pendingPostLimit} onChange={(event) => setAssignment((current) => ({ ...current, pendingPostLimit: Number(event.target.value) }))} /><small>Awaiting approval at one time</small></label></section>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={resetUsage} disabled={saving}>Reset used allowance</Button><Button onClick={save} disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save teacher access'}</Button></div></> : <div className="empty-state">Select a teacher to manage their access.</div>}
      </Card>
    </div>
  </div>
}
