import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'

function getInitials(student) {
  const first = student?.firstName?.trim()?.charAt(0) ?? ''
  const last = student?.lastName?.trim()?.charAt(0) ?? ''
  return `${first}${last}`.toUpperCase() || 'S'
}

export function StudentTable({ students = [], onSelect, onEdit, onArchive, onRestore, onDelete }) {
  if (!students.length) {
    return <div className="empty-state">No students found for the current filters.</div>
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Student No.</th>
            <th>Student Name</th>
            <th>School Year</th>
            <th>Strand</th>
            <th>Section</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>
                <div className="student-photo-cell">
                  {student.approvedPhotoUrl ? (
                    <img src={student.approvedPhotoUrl} alt={student.firstName || 'Student'} className="student-photo-thumb" />
                  ) : (
                    <span className="student-avatar-small">{getInitials(student)}</span>
                  )}
                </div>
              </td>
              <td>{student.studentNumber || '—'}</td>
              <td>
                <button type="button" className="table-link" onClick={() => onSelect?.(student.id)}>
                  {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}
                </button>
              </td>
              <td>{student.schoolYearName || student.schoolYearId || '—'}</td>
              <td>{student.strandName || student.strandId || '—'}</td>
              <td>{student.sectionId || '—'}</td>
              <td><Badge status={student.status || 'active'}>{student.status || 'active'}</Badge></td>
              <td>
                <div className="inline-actions">
                  <Button type="button" variant="secondary" size="sm" onClick={() => onSelect?.(student.id)}>View</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => onEdit?.(student)}>Edit</Button>
                  {student.status === 'archived' ? (
                    <Button type="button" size="sm" onClick={() => onRestore?.(student)}>Restore</Button>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" onClick={() => onArchive?.(student)}>Archive</Button>
                  )}
                  <Button type="button" variant="danger" size="sm" onClick={() => onDelete?.(student)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
