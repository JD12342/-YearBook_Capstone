import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

function getInitials(student) {
  const first = student?.firstName?.trim()?.charAt(0) ?? ''
  const last = student?.lastName?.trim()?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'S'
}

export function StudentProfileModal({ isOpen, student, schoolYear, strand, onClose, onEdit, onArchive, onRestore, onDelete }) {
  if (!isOpen || !student) return null

  const hasApprovedPhoto = Boolean(student.photoId && student.approvedPhotoUrl)

  return (
    <Modal isOpen={isOpen} title="Student details" onClose={onClose}>
      <div className="student-profile-box">
        <div className="student-profile-header">
          <div className="profile-avatar large">
            {hasApprovedPhoto ? <img src={student.approvedPhotoUrl} alt={student.firstName} className="student-photo-thumb" /> : getInitials(student)}
          </div>
          <div>
            <h3>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}</h3>
            <p>{student.studentNumber || 'No student number'}</p>
          </div>
        </div>

        <div className="student-metrics">
          <div>
            <span>School Year</span>
            <strong>{schoolYear?.name ?? '—'}</strong>
          </div>
          <div>
            <span>Strand</span>
            <strong>{strand?.name ?? '—'}</strong>
          </div>
          <div>
            <span>Section</span>
            <strong>{student.sectionId || '—'}</strong>
          </div>
        </div>

        <div className="student-detail-grid">
          <div>
            <span className="detail-label">Status</span>
            <strong>{student.status || 'active'}</strong>
          </div>
          <div>
            <span className="detail-label">Photo status</span>
            <strong>{student.photoStatus || 'No approved photo'}</strong>
          </div>
        </div>

        <div className="student-detail-grid">
          <div>
            <span className="detail-label">Approved photo</span>
            <strong>{hasApprovedPhoto ? 'Available' : 'No approved photo'}</strong>
          </div>
          <div>
            <span className="detail-label">Suffix</span>
            <strong>{student.suffix || '—'}</strong>
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="button" variant="secondary" onClick={onEdit}>Edit</Button>
          {student.status === 'archived' ? (
            <Button type="button" onClick={onRestore}>Restore</Button>
          ) : (
            <Button type="button" variant="secondary" onClick={onArchive}>Archive</Button>
          )}
          <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </Modal>
  )
}
