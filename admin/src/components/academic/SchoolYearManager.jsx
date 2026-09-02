import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal.jsx'
import { SchoolYearForm } from '../schoolYears/SchoolYearForm.jsx'
import { createSchoolYear, deleteSchoolYear, getSchoolYears, updateSchoolYear } from '../../services/schoolYearService.js'
import { getSections } from '../../services/sectionService.js'
import { getStrands } from '../../services/strandService.js'
import { getStudents } from '../../services/studentService.js'
import { getYearbooks, updateYearbook } from '../../services/yearbookService.js'
import { reauthenticateAdmin } from '../../services/firebase/auth.js'

export function SchoolYearManager() {
  const [schoolYears, setSchoolYears] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadSchoolYears = async () => {
    setLoading(true)
    setError('')

    try {
      const years = await getSchoolYears()
      const enriched = await Promise.all(
        years.map(async (schoolYear) => {
          const [strands, sections, students, yearbooks] = await Promise.all([
            getStrands(schoolYear.id),
            getSections({ schoolYearId: schoolYear.id }),
            getStudents({ schoolYearId: schoolYear.id }),
            getYearbooks({ schoolYearId: schoolYear.id }),
          ])

          return {
            ...schoolYear,
            strandsCount: strands.length,
            sectionsCount: sections.length,
            studentsCount: students.length,
            yearbook: yearbooks[0] ?? null,
          }
        }),
      )

      setSchoolYears(enriched)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load school years.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchoolYears()
  }, [])

  const filteredSchoolYears = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return schoolYears

    return schoolYears.filter((schoolYear) => {
      const haystack = [schoolYear.name, schoolYear.startYear, schoolYear.endYear].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchTerm, schoolYears])

  const handleSubmit = async (payload) => {
    try {
      const createdId = await createSchoolYear(payload)
      const createdSchoolYear = {
        ...payload,
        id: createdId,
        name: payload.name?.trim() || `${payload.startYear ?? new Date().getFullYear()}-${payload.endYear ?? new Date().getFullYear() + 1}`,
        status: payload.status || 'active',
        strandsCount: 0,
        sectionsCount: 0,
        studentsCount: 0,
        yearbook: null,
      }

      setSchoolYears((current) => [createdSchoolYear, ...current])
      setIsFormOpen(false)
      await loadSchoolYears()
    } catch (submitError) {
      setError(submitError.message || 'Unable to save school year.')
    }
  }

  const handleArchive = async (schoolYearId) => {
    try {
      await updateSchoolYear(schoolYearId, { status: 'archived' })
      await loadSchoolYears()
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive school year.')
    }
  }

  const handleDeleteConfirm = async (password) => {
    if (!pendingDelete) {
      throw new Error('No school year selected for deletion.')
    }

    setDeleteLoading(true)
    try {
      await reauthenticateAdmin(password)
      await deleteSchoolYear(pendingDelete.id)
      setSchoolYears((current) => current.filter((schoolYear) => schoolYear.id !== pendingDelete.id))
      setSelectedSchoolYear(null)
      setPendingDelete(null)
      await loadSchoolYears()
    } catch (submitError) {
      setError(submitError.message || 'Unable to delete school year.')
      throw submitError
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleYearbookStatusChange = async (schoolYearId, nextStatus) => {
    try {
      const yearbook = schoolYears.find((year) => year.id === schoolYearId)?.yearbook
      if (!yearbook) {
        setError('No yearbook record exists for this school year yet.')
        return
      }

      await updateYearbook(yearbook.id, { status: nextStatus })
      await loadSchoolYears()
    } catch (submitError) {
      setError(submitError.message || 'Unable to update yearbook status.')
    }
  }

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">School Years</div>
          <h3>School year directory</h3>
        </div>
      </div>

      <div className="toolbar-card bar-form-card">
        <div className="bar-form-inline">
          <div className="bar-form-field">
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search school years..." />
          </div>
          <Button className="bar-form-button" onClick={() => setIsFormOpen(true)}>+ Add School Year</Button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDelete)}
        title="Delete school year"
        message={`This will permanently remove ${pendingDelete?.name || 'this school year'} from the system. Enter your admin password to continue.`}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      <Modal isOpen={isFormOpen} title="Create school year" onClose={() => setIsFormOpen(false)}>
        <SchoolYearForm onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      <Modal isOpen={Boolean(selectedSchoolYear)} title={selectedSchoolYear?.name || 'School year details'} onClose={() => setSelectedSchoolYear(null)}>
        {selectedSchoolYear && (
          <div className="detail-stack">
            <div className="detail-row"><span>School Year</span><strong>{selectedSchoolYear.name}</strong></div>
            <div className="detail-row"><span>Status</span><Badge status={selectedSchoolYear.status === 'active' ? 'active' : 'archived'}>{selectedSchoolYear.status || 'active'}</Badge></div>
            <div className="detail-row"><span>Yearbook</span><strong>{selectedSchoolYear.yearbook?.title || 'No yearbook created yet'}</strong></div>
            <div className="detail-row"><span>Yearbook Status</span><strong>{selectedSchoolYear.yearbook?.status || 'draft'}</strong></div>
            <div className="detail-row"><span>Strands</span><strong>{selectedSchoolYear.strandsCount ?? 0}</strong></div>
            <div className="detail-row"><span>Sections</span><strong>{selectedSchoolYear.sectionsCount ?? 0}</strong></div>
            <div className="detail-row"><span>Students</span><strong>{selectedSchoolYear.studentsCount ?? 0}</strong></div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => window.location.assign(`/students?schoolYearId=${selectedSchoolYear.id}`)}>View Students</Button>
              <Button variant="secondary" onClick={() => window.location.assign(`/academic?tab=strands-sections`)}>View Strands & Sections</Button>
            </div>
          </div>
        )}
      </Modal>

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading school years...</div>
        ) : filteredSchoolYears.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School Year</th>
                  <th>Status</th>
                  <th>Yearbook</th>
                  <th>Strands</th>
                  <th>Sections</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchoolYears.map((schoolYear) => {
                  const yearbookStatus = schoolYear.yearbook?.status || 'draft'
                  const isYearbookArchived = yearbookStatus === 'archived'

                  return (
                    <tr key={schoolYear.id}>
                      <td>{schoolYear.name}</td>
                      <td><Badge status={schoolYear.status === 'active' ? 'active' : 'archived'}>{schoolYear.status || 'active'}</Badge></td>
                      <td>{schoolYear.yearbook?.title || 'No yearbook created yet'}</td>
                      <td>{schoolYear.strandsCount ?? 0}</td>
                      <td>{schoolYear.sectionsCount ?? 0}</td>
                      <td>{schoolYear.studentsCount ?? 0}</td>
                      <td>
                        <div className="inline-actions">
                          <button type="button" className="table-action-button" onClick={() => setSelectedSchoolYear(schoolYear)}>View</button>
                          {isYearbookArchived ? (
                            <button type="button" className="table-action-button alt" onClick={() => handleYearbookStatusChange(schoolYear.id, 'active')}>Activate</button>
                          ) : (
                            <button type="button" className="table-action-button alt" onClick={() => handleYearbookStatusChange(schoolYear.id, 'archived')}>Archive</button>
                          )}
                          <button type="button" className="table-action-button danger" onClick={() => setPendingDelete({ id: schoolYear.id, name: schoolYear.name })}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No school years found.</div>
        )}
      </Card>
    </div>
  )
}
