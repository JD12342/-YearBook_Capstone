import { useEffect, useState } from 'react'
import { Award, Pencil, X } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'

function getInitials(student) {
  const first = student?.firstName?.trim()?.charAt(0) ?? ''
  const last = student?.lastName?.trim()?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'S'
}

export function StudentProfilePanel({ student, schoolYear, strand, section, onClose, onEditStudent, onSaveProfile, saving = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({ lrn: '', email: '', credentials: '', awards: '' })

  useEffect(() => {
    setProfile({
      lrn: student?.lrn || '',
      email: student?.email || '',
      credentials: student?.credentials || '',
      awards: student?.awards || '',
    })
    setIsEditing(false)
  }, [student])

  if (!student) return null

  const saveProfile = async (event) => {
    event.preventDefault()
    await onSaveProfile(profile)
    setIsEditing(false)
  }

  const fullName = [student.firstName, student.middleName, student.lastName, student.suffix].filter(Boolean).join(' ')

  return (
    <aside className="student-profile-panel">
      <div className="student-profile-panel-header">
        <span className="page-kicker">Selected student</span>
        <button type="button" className="profile-panel-close" onClick={onClose} aria-label="Close student profile"><X size={18} /></button>
      </div>

      <div className="student-profile-header">
        <div className="profile-avatar large">
          {student.approvedPhotoUrl ? <img src={student.approvedPhotoUrl} alt={fullName} className="student-photo-thumb" /> : getInitials(student)}
        </div>
        <div><h3>{fullName}</h3><p>{student.studentNumber || 'No student number'}</p></div>
      </div>

      <div className="student-metrics compact-metrics">
        <div><span>School year</span><strong>{schoolYear?.name || '—'}</strong></div>
        <div><span>Strand</span><strong>{strand?.code || strand?.name || '—'}</strong></div>
        <div><span>Section</span><strong>{section?.code || section?.name || '—'}</strong></div>
        <div><span>Status</span><strong><Badge status={student.status || 'active'}>{student.status || 'active'}</Badge></strong></div>
      </div>

      <div className="profile-panel-section-title"><Award size={17} aria-hidden="true" /><h3>Graduation profile</h3></div>
      {isEditing ? (
        <form className="profile-form" onSubmit={saveProfile}>
          <label className="form-field"><span>LRN</span><Input value={profile.lrn} onChange={(event) => setProfile((current) => ({ ...current, lrn: event.target.value }))} placeholder="Learner reference number" /></label>
          <label className="form-field"><span>Email</span><Input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} placeholder="student@email.com" /></label>
          <label className="form-field"><span>Credentials</span><textarea className="field profile-textarea" value={profile.credentials} onChange={(event) => setProfile((current) => ({ ...current, credentials: event.target.value }))} placeholder="Leadership roles, organizations, certifications..." /></label>
          <label className="form-field"><span>Graduation awards</span><textarea className="field profile-textarea" value={profile.awards} onChange={(event) => setProfile((current) => ({ ...current, awards: event.target.value }))} placeholder="Honors, distinctions, and awards..." /></label>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button></div>
        </form>
      ) : (
        <div className="profile-summary">
          <div><span>LRN</span><strong>{student.lrn || 'Not added'}</strong></div>
          <div><span>Email</span><strong>{student.email || 'Not added'}</strong></div>
          <div><span>Credentials</span><p>{student.credentials || 'No credentials added yet.'}</p></div>
          <div><span>Graduation awards</span><p>{student.awards || 'No awards added yet.'}</p></div>
        </div>
      )}
      {!isEditing && <div className="profile-panel-actions"><Button type="button" variant="secondary" onClick={onEditStudent}>Edit student</Button><Button type="button" onClick={() => setIsEditing(true)}><Pencil size={15} aria-hidden="true" /> Edit graduation profile</Button></div>}
    </aside>
  )
}
