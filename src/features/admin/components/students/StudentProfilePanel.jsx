import { useEffect, useState } from 'react'
import { Award, Pencil, UserRound } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'

export function StudentProfilePanel({ student, schoolYear, strand, section, onEditStudent, onSaveProfile, saving = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({ email: '', credentials: '', awards: '' })

  useEffect(() => {
    setProfile({
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
      <div className="student-id-card">
        <div className="student-id-photo">
          {student.approvedPhotoUrl ? <img src={student.approvedPhotoUrl} alt={fullName} className="student-photo-thumb" /> : <UserRound size={34} strokeWidth={1.5} aria-label="No profile photo" />}
        </div>
        <div className="student-id-content">
          <div className="student-id-brand">
            <img src="/snhs-seal.png" alt="" />
            <div><strong>Sorsogon National High School</strong><span>Official graduation record</span></div>
          </div>
          <div className="student-id-name"><span>Student</span><h3>{fullName}</h3><p>LRN {student.studentNumber || student.lrn || 'Not added'}</p></div>
          <div className="student-metrics compact-metrics">
            <div><span>School year</span><strong>{schoolYear?.name || '—'}</strong></div>
            <div><span>Strand</span><strong>{strand?.code || strand?.name || '—'}</strong></div>
            <div><span>Section</span><strong>{section?.code || section?.name || '—'}</strong></div>
            <div><span>Status</span><strong><Badge status={student.status || 'active'}>{student.status || 'active'}</Badge></strong></div>
          </div>
        </div>
        {!isEditing && <div className="student-id-profile">
          <div className="student-id-profile-title"><Award size={17} aria-hidden="true" /><h3>Graduation profile</h3></div>
          <div className="profile-summary student-profile-summary">
            <div><span>LRN</span><strong>{student.studentNumber || student.lrn || 'Not added'}</strong></div>
            <div><span>Email</span><strong>{student.email || 'Not added'}</strong></div>
            <div><span>Credentials</span><p>{student.credentials || 'No credentials added yet.'}</p></div>
            <div><span>Graduation awards</span><p>{student.awards || 'No awards added yet.'}</p></div>
          </div>
        </div>}
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={saveProfile}>
          <label className="form-field"><span>Email</span><Input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} placeholder="student@email.com" /></label>
          <label className="form-field"><span>Credentials</span><textarea className="field profile-textarea" value={profile.credentials} onChange={(event) => setProfile((current) => ({ ...current, credentials: event.target.value }))} placeholder="Leadership roles, organizations, certifications..." /></label>
          <label className="form-field"><span>Graduation awards</span><textarea className="field profile-textarea" value={profile.awards} onChange={(event) => setProfile((current) => ({ ...current, awards: event.target.value }))} placeholder="Honors, distinctions, and awards..." /></label>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button></div>
        </form>
      ) : null}
      {!isEditing && <div className="profile-panel-actions"><Button type="button" variant="secondary" onClick={onEditStudent}>Edit student</Button><Button type="button" onClick={() => setIsEditing(true)}><Pencil size={15} aria-hidden="true" /> Edit graduation profile</Button></div>}
    </aside>
  )
}
