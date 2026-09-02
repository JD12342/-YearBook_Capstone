import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { StudentForm } from '../../components/students/StudentForm.jsx'
import { StudentTable } from '../../components/students/StudentTable.jsx'
import { BulkStudentImport } from '../../components/students/BulkStudentImport.jsx'
import { StudentProfileModal } from '../../components/students/StudentProfileModal.jsx'
import { DeleteConfirmationModal } from '../../components/ui/DeleteConfirmationModal.jsx'
import { useStudents } from '../../hooks/useStudents.js'
import { reauthenticateAdmin } from '../../services/firebase/auth.js'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export function StudentManagementPage() {
  const {
    schoolYears,
    strands,
    sections,
    visibleStudents,
    selectedSchoolYear,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    selectedStrand,
    selectedStrandId,
    setSelectedStrandId,
    selectedSectionId,
    setSelectedSectionId,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    selectedStudent,
    setSelectedStudentId,
    selectedSectionOptions,
    loading,
    error,
    addStudent,
    updateStudent,
    removeStudent,
    archiveStudent,
    restoreStudent,
    bulkImportStudents,
  } = useStudents()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const canShowBulkButton = Boolean(selectedSchoolYearId && selectedStrandId && selectedSectionId)

  const tableRows = useMemo(() => visibleStudents.map((student) => ({
    ...student,
    schoolYearName: schoolYears.find((year) => year.id === student.schoolYearId)?.name || '—',
    strandName: strands.find((strand) => strand.id === student.strandId)?.name || '—',
  })), [visibleStudents, schoolYears, strands])

  const handleFormOpen = (student = null) => {
    setSubmitError('')
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (payload) => {
    try {
      setSubmitError('')
      if (!payload.firstName?.trim() || !payload.lastName?.trim() || !payload.studentNumber?.trim()) {
        throw new Error('First name, last name, and student number are required.')
      }
      if (!payload.schoolYearId || !payload.strandId || !payload.sectionId) {
        throw new Error('Please select a school year, strand, and section.')
      }

      if (editingStudent) {
        await updateStudent(editingStudent.id, payload)
      } else {
        await addStudent(payload)
      }

      setSuccessMessage(editingStudent ? 'Student updated.' : 'Student created.')
      setIsFormOpen(false)
      setEditingStudent(null)
    } catch (submitErrorObj) {
      setSubmitError(submitErrorObj.message || 'Unable to save student data.')
    }
  }

  const handleBulkImport = async ({ schoolYearId, strandId, sectionId, rows }) => {
    try {
      await bulkImportStudents({ schoolYearId, strandId, sectionId, rows })
      setSuccessMessage(`${rows.length} students imported successfully.`)
      setIsBulkOpen(false)
    } catch (bulkError) {
      setSubmitError(bulkError.message || 'Unable to import students.')
    }
  }

  const handleDeleteConfirm = async (password) => {
    if (!pendingDelete) throw new Error('No student selected for deletion.')
    await reauthenticateAdmin(password)
    await removeStudent(pendingDelete.id)
    setPendingDelete(null)
    setSuccessMessage('Student deleted permanently.')
  }

  const openProfile = (student) => {
    setSelectedStudentId(student.id)
    setIsProfileOpen(true)
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Student Management</div>
          <h2>Student directory</h2>
        </div>
      </div>

      <Card className="panel-card">
        <div className="data-toolbar-row">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by student number or name"
            className="data-search"
          />

          <select value={selectedSchoolYearId} onChange={(event) => setSelectedSchoolYearId(event.target.value)} className="data-select">
            <option value="">All school years</option>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>

          <select value={selectedStrandId} onChange={(event) => setSelectedStrandId(event.target.value)} className="data-select">
            <option value="">All strands</option>
            {strands.map((strand) => (
              <option key={strand.id} value={strand.id}>{strand.name}</option>
            ))}
          </select>

          <select value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)} className="data-select">
            <option value="">All sections</option>
            {selectedSectionOptions.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="data-select">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <Button type="button" onClick={() => handleFormOpen()}>+ Add Student</Button>
          <Button type="button" variant="secondary" onClick={() => setIsBulkOpen(true)} disabled={!canShowBulkButton}>+ Bulk Add Students</Button>
        </div>
      </Card>

      {error && <div className="form-error">{error}</div>}
      {submitError && <div className="form-error">{submitError}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading students...</div>
        ) : tableRows.length ? (
          <StudentTable
            students={tableRows}
            onSelect={(studentId) => {
              const nextStudent = visibleStudents.find((student) => student.id === studentId)
              if (nextStudent) openProfile(nextStudent)
            }}
            onEdit={(student) => handleFormOpen(student)}
            onArchive={async (student) => {
              await archiveStudent(student.id)
              setSuccessMessage('Student archived.')
            }}
            onRestore={async (student) => {
              await restoreStudent(student.id)
              setSuccessMessage('Student restored.')
            }}
            onDelete={(student) => setPendingDelete(student)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No students found</div>
            <div>No students have been added to this section yet.</div>
            <div className="space-top">
              <Button type="button" onClick={() => handleFormOpen()}>+ Add Student</Button>
              <Button type="button" variant="secondary" onClick={() => setIsBulkOpen(true)} className="left-gap">+ Bulk Add Students</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={isFormOpen} title={editingStudent ? 'Edit student' : 'Add student'} onClose={() => { setIsFormOpen(false); setEditingStudent(null); setSubmitError('') }}>
        <StudentForm
          student={editingStudent}
          schoolYears={schoolYears}
          strands={strands}
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingStudent(null); setSubmitError('') }}
          submitLabel={editingStudent ? 'Update student' : 'Create student'}
        />
      </Modal>

      <Modal isOpen={isBulkOpen} title="Bulk add students" onClose={() => { setIsBulkOpen(false); setSubmitError('') }}>
        <BulkStudentImport
          schoolYears={schoolYears}
          strands={strands}
          existingStudents={visibleStudents}
          onClose={() => setIsBulkOpen(false)}
          onImport={handleBulkImport}
        />
      </Modal>

      <StudentProfileModal
        isOpen={isProfileOpen}
        student={selectedStudent}
        schoolYear={selectedSchoolYear}
        strand={selectedStrand}
        onClose={() => setIsProfileOpen(false)}
        onEdit={() => {
          setIsProfileOpen(false)
          handleFormOpen(selectedStudent)
        }}
        onArchive={async () => {
          if (selectedStudent) {
            await archiveStudent(selectedStudent.id)
            setSuccessMessage('Student archived.')
            setIsProfileOpen(false)
          }
        }}
        onRestore={async () => {
          if (selectedStudent) {
            await restoreStudent(selectedStudent.id)
            setSuccessMessage('Student restored.')
            setIsProfileOpen(false)
          }
        }}
        onDelete={() => {
          if (selectedStudent) {
            setPendingDelete(selectedStudent)
            setIsProfileOpen(false)
          }
        }}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDelete)}
        title="Delete student?"
        message={`This will permanently remove ${pendingDelete ? `${pendingDelete.firstName || ''} ${pendingDelete.lastName || ''}`.trim() || 'this student' : 'this student'} from the system.`}
        warning="This action cannot be undone. Please confirm with your admin password."
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
