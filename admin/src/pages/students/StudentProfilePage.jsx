import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { useStudents } from '../../hooks/useStudents.js'

export function StudentProfilePage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { students, schoolYears, strands, selectedStudent, setSelectedStudentId } = useStudents()

  const student = useMemo(() => {
    const match = students.find((entry) => entry.id === studentId) ?? selectedStudent
    if (match) setSelectedStudentId(match.id)
    return match ?? null
  }, [students, selectedStudent, setSelectedStudentId, studentId])

  const schoolYear = schoolYears.find((year) => year.id === student?.schoolYearId)
  const strand = strands.find((entry) => entry.id === student?.strandId)

  if (!student) {
    return (
      <div className="page-stack">
        <Card className="panel-card placeholder-card">
          <h3>Student not found</h3>
          <p>The selected student could not be found in the current record set.</p>
          <Button onClick={() => navigate('/students')}>Back to Students</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Student Profile</div>
          <h2>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}</h2>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => navigate('/students')}>Back</Button>
          <Button onClick={() => navigate(`/students`)}>Edit Student</Button>
        </div>
      </div>

      <div className="student-page-grid">
        <Card className="panel-card student-panel">
          <div className="widget-header">
            <h3>Overview</h3>
          </div>

          <div className="student-profile-box">
            <div className="student-profile-header">
              <div className="profile-avatar large">{[student.firstName, student.lastName].filter(Boolean).join(' ').charAt(0).toUpperCase()}</div>
              <div>
                <h3>{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}</h3>
                <p>{student.studentNumber || 'No student number'}</p>
              </div>
            </div>

            <div className="student-metrics">
              <div>
                <span>School Year</span>
                <strong>{schoolYear?.name ?? student.schoolYearId ?? '—'}</strong>
              </div>
              <div>
                <span>Strand</span>
                <strong>{strand?.name ?? student.strandId ?? '—'}</strong>
              </div>
              <div>
                <span>Section</span>
                <strong>{student.sectionId || '—'}</strong>
              </div>
            </div>

            <div className="student-detail-grid">
              <div>
                <span className="detail-label">Photo</span>
                <strong>{student.photoStatus || 'No Photo'}</strong>
              </div>
              <div>
                <span className="detail-label">Status</span>
                <strong><Badge status={student.status}>{student.status || 'active'}</Badge></strong>
              </div>
              <div>
                <span className="detail-label">LRN</span>
                <strong>{student.lrn || '—'}</strong>
              </div>
              <div>
                <span className="detail-label">Email</span>
                <strong>{student.email || '—'}</strong>
              </div>
            </div>
          </div>
        </Card>

        <Card className="panel-card student-panel">
          <div className="widget-header">
            <h3>Photo actions</h3>
          </div>
          <div className="action-list">
            <Button variant="secondary" onClick={() => navigate('/photos')}>Capture Photo</Button>
            <Button variant="secondary" onClick={() => navigate('/photos/existing')}>Upload Existing Photo</Button>
            <Button variant="secondary" onClick={() => navigate('/photos/editing')}>View Photo</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
