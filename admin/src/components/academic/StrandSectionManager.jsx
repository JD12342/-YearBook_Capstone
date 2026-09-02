import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Select } from '../ui/Select.jsx'
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createStrand, deleteStrand, getStrands, updateStrand } from '../../services/strandService.js'
import { createSection, deleteSection, getSections, updateSection } from '../../services/sectionService.js'
import { getStudents } from '../../services/studentService.js'
import { reauthenticateAdmin } from '../../services/firebase/auth.js'
import { AddSectionModal } from './AddSectionModal.jsx'
import { StrandDetailsModal } from './StrandDetailsModal.jsx'

export function StrandSectionManager() {
  const navigate = useNavigate()
  const [schoolYears, setSchoolYears] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [strands, setStrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [activeModal, setActiveModal] = useState(null)
  const [selectedStrandDetail, setSelectedStrandDetail] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [strandForm, setStrandForm] = useState({ name: '', code: '', status: 'active', schoolYearId: '' })
  const [sectionForm, setSectionForm] = useState({ name: '', code: '', schoolYearId: '', strandId: '', status: 'active' })

  const loadSchoolYears = async () => {
    const years = await getSchoolYears()
    setSchoolYears(years)
    if (!selectedSchoolYearId && years[0]?.id) {
      setSelectedSchoolYearId(years[0].id)
    }
  }

  const loadStrands = async (schoolYearId) => {
    if (!schoolYearId) {
      setStrands([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const records = await getStrands(schoolYearId)
      const withSections = await Promise.all(
        records.map(async (strand) => {
          const sections = await getSections({ schoolYearId, strandId: strand.id })
          const sectionsWithCounts = await Promise.all(
            sections.map(async (section) => {
              const students = await getStudents({ schoolYearId, strandId: strand.id, sectionId: section.id })
              return { ...section, studentsCount: students.length }
            }),
          )

          return { ...strand, sections: sectionsWithCounts }
        }),
      )
      setStrands(withSections)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load strands and sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchoolYears().catch((loadError) => {
      setError(loadError.message || 'Unable to load school years.')
    })
  }, [])

  useEffect(() => {
    if (!selectedSchoolYearId) return
    loadStrands(selectedSchoolYearId)
  }, [selectedSchoolYearId])

  const selectedSchoolYear = useMemo(
    () => schoolYears.find((year) => year.id === selectedSchoolYearId) ?? null,
    [schoolYears, selectedSchoolYearId],
  )

  const handleAddStrand = () => {
    setStrandForm({
      name: '',
      code: '',
      status: 'active',
      schoolYearId: selectedSchoolYearId,
    })
    setActiveModal('strand-create')
  }

  const filteredStrands = useMemo(
    () => strands.filter((strand) => {
      const status = strand.status || 'active'
      return statusFilter === 'all' ? true : status === statusFilter
    }),
    [strands, statusFilter],
  )

  const handleSubmitStrand = async (event) => {
    event.preventDefault()
    if (!strandForm.schoolYearId || !strandForm.name.trim()) {
      setError('Please choose a school year and provide a strand name.')
      return
    }

    try {
      const createdId = await createStrand({
        schoolYearId: strandForm.schoolYearId,
        name: strandForm.name.trim(),
        code: strandForm.code.trim() || strandForm.name.trim(),
        status: strandForm.status || 'active',
      })

      const createdStrand = {
        id: createdId,
        schoolYearId: strandForm.schoolYearId,
        name: strandForm.name.trim(),
        code: strandForm.code.trim() || strandForm.name.trim(),
        status: strandForm.status || 'active',
        sections: [],
      }

      setStrands((current) => [createdStrand, ...current])
      setActiveModal(null)
      setStrandForm({ name: '', code: '', status: 'active', schoolYearId: selectedSchoolYearId })
      await loadStrands(selectedSchoolYearId)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create strand.')
    }
  }

  const handleArchiveStrand = async (strandId) => {
    try {
      await updateStrand(strandId, { status: 'archived' })
      await loadStrands(selectedSchoolYearId)
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive strand.')
    }
  }

  const handleOpenSectionCreate = (strand) => {
    setSelectedStrandDetail((current) => current && current.id === strand.id ? current : strand)
    setSectionForm({
      name: '',
      code: '',
      schoolYearId: selectedSchoolYearId,
      strandId: strand.id,
      status: 'active',
    })
    setActiveModal('section-create')
  }

  const handleSubmitSection = async (event) => {
    event.preventDefault()
    if (!sectionForm.schoolYearId || !sectionForm.strandId || !sectionForm.name.trim()) {
      setError('Please provide a valid section name and selected strand.')
      return
    }

    try {
      const createdId = await createSection({
        schoolYearId: sectionForm.schoolYearId,
        strandId: sectionForm.strandId,
        name: sectionForm.name.trim(),
        code: sectionForm.code.trim() || `${sectionForm.name.trim()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        status: sectionForm.status || 'active',
      })

      const createdSection = {
        id: createdId,
        schoolYearId: sectionForm.schoolYearId,
        strandId: sectionForm.strandId,
        name: sectionForm.name.trim(),
        code: sectionForm.code.trim() || `${sectionForm.name.trim()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        status: sectionForm.status || 'active',
        studentsCount: 0,
      }

      setStrands((current) => current.map((strand) => (
        strand.id === sectionForm.strandId
          ? { ...strand, sections: [createdSection, ...(strand.sections ?? [])] }
          : strand
      )))

      const targetStrand = strands.find((strand) => strand.id === sectionForm.strandId) ?? { id: sectionForm.strandId, name: '' }
      setSelectedStrandDetail((current) => current && current.id === targetStrand.id ? { ...current, sections: [createdSection, ...(current.sections ?? [])] } : current)
      setActiveModal('strand-details')
      setSectionForm({ name: '', code: '', schoolYearId: selectedSchoolYearId, strandId: '', status: 'active' })
      await loadStrands(selectedSchoolYearId)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create section.')
    }
  }

  const handleArchiveSection = async (sectionId) => {
    try {
      await updateSection(sectionId, { status: 'archived' })
      await loadStrands(selectedSchoolYearId)
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive section.')
    }
  }

  const handleDeleteConfirm = async (password) => {
    if (!pendingDelete) {
      throw new Error('No record selected for deletion.')
    }

    setDeleteLoading(true)
    try {
      await reauthenticateAdmin(password)

      if (pendingDelete.type === 'strand') {
        await deleteStrand(pendingDelete.id)
        setStrands((current) => current.filter((strand) => strand.id !== pendingDelete.id))
      }

      if (pendingDelete.type === 'section') {
        await deleteSection(pendingDelete.id)
        setStrands((current) => current.map((strand) => ({
          ...strand,
          sections: (strand.sections ?? []).filter((section) => section.id !== pendingDelete.id),
        })))
      }

      setPendingDelete(null)
      if (pendingDelete.type === 'strand') {
        setSelectedStrandDetail(null)
      }
      if (pendingDelete.type === 'section') {
        setSelectedStrandDetail((current) => current ? { ...current, sections: (current.sections ?? []).filter((section) => section.id !== pendingDelete.id) } : current)
      }
      await loadStrands(selectedSchoolYearId)
    } catch (submitError) {
      setError(submitError.message || 'Unable to delete the selected record.')
      throw submitError
    } finally {
      setDeleteLoading(false)
    }
  }

  const detailSections = selectedStrandDetail?.sections ?? []

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">Strands & Sections</div>
          <h3>Academic structure</h3>
        </div>
        <Button onClick={handleAddStrand}>+ Add Strand</Button>
      </div>

      <div className="toolbar-card bar-form-card">
        <div className="bar-form-inline">
          <div className="bar-form-field">
            <label className="field-label">School Year</label>
            <Select value={selectedSchoolYearId} onChange={(event) => setSelectedSchoolYearId(event.target.value)}>
              <option value="">Select school year</option>
              {schoolYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </Select>
          </div>

          <div className="bar-form-field compact-field">
            <label className="field-label">Status</label>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <Button className="bar-form-button" onClick={handleAddStrand}>+ Add Strand</Button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <DeleteConfirmationModal
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'section' ? `Delete ${pendingDelete?.name || 'section'}?` : `Delete ${pendingDelete?.name || 'strand'}?`}
        message={`This action cannot be undone. Enter your admin password to continue.`}
        warning={pendingDelete?.type === 'strand' && (pendingDelete.sectionCount > 0 || pendingDelete.studentCount > 0)
          ? `This strand contains ${pendingDelete.sectionCount || 0} sections and ${pendingDelete.studentCount || 0} students. Deleting it may affect related academic records.`
          : pendingDelete?.type === 'section'
            ? 'Deleting this section will remove it from the selected school year and strand.'
            : ''}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      <Modal isOpen={activeModal === 'strand-create'} title="Create strand" onClose={() => setActiveModal(null)}>
        <form className="student-form" onSubmit={handleSubmitStrand}>
          <div className="field-grid">
            <label className="form-field span-2">
              <span>School Year</span>
              <Select value={strandForm.schoolYearId} onChange={(event) => setStrandForm((current) => ({ ...current, schoolYearId: event.target.value }))} required>
                <option value="">Select school year</option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field span-2">
              <span>Strand Name</span>
              <Input value={strandForm.name} onChange={(event) => setStrandForm((current) => ({ ...current, name: event.target.value }))} placeholder="Science, Technology, Engineering and Mathematics" required />
            </label>

            <label className="form-field span-2">
              <span>Strand Code</span>
              <Input value={strandForm.code} onChange={(event) => setStrandForm((current) => ({ ...current, code: event.target.value }))} placeholder="STEM" />
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit">Create Strand</Button>
          </div>
        </form>
      </Modal>

      <AddSectionModal
        isOpen={activeModal === 'section-create'}
        schoolYearName={selectedSchoolYear?.name || ''}
        strandName={strands.find((strand) => strand.id === sectionForm.strandId)?.name || ''}
        form={sectionForm}
        onChange={(field, value) => setSectionForm((current) => ({ ...current, [field]: value }))}
        onSubmit={handleSubmitSection}
        onCancel={() => {
          setActiveModal(selectedStrandDetail ? 'strand-details' : null)
          setSectionForm({ name: '', code: '', schoolYearId: selectedSchoolYearId, strandId: selectedStrandDetail?.id || '', status: 'active' })
        }}
        loading={false}
      />

      <StrandDetailsModal
        isOpen={activeModal === 'strand-details'}
        strand={selectedStrandDetail}
        schoolYearName={selectedSchoolYear?.name || ''}
        onClose={() => {
          setSelectedStrandDetail(null)
          setActiveModal(null)
        }}
        onAddSection={() => {
          if (!selectedStrandDetail) return
          setSectionForm({
            name: '',
            code: '',
            schoolYearId: selectedSchoolYearId,
            strandId: selectedStrandDetail.id,
            status: 'active',
          })
          setActiveModal('section-create')
        }}
        onViewStudents={(sectionId) => navigate(`/students?schoolYearId=${selectedSchoolYearId}&strandId=${selectedStrandDetail.id}&sectionId=${sectionId}`)}
        onArchiveSection={handleArchiveSection}
        onDeleteSection={(sectionId, sectionName) => setPendingDelete({ type: 'section', id: sectionId, name: sectionName })}
      />

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading strands and sections...</div>
        ) : !selectedSchoolYear ? (
          <div className="empty-state">No school years found.</div>
        ) : filteredStrands.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Strand</th>
                  <th>Code</th>
                  <th>Sections</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrands.map((strand) => {
                  const sectionList = strand.sections ?? []
                  const totalStudents = sectionList.reduce((sum, section) => sum + (section.studentsCount ?? 0), 0)

                  return (
                    <tr key={strand.id}>
                      <td>
                        <div className="table-name-cell">
                          <span>{strand.name}</span>
                        </div>
                      </td>
                      <td>{strand.code || '—'}</td>
                      <td>{sectionList.length ? `${sectionList.length} section${sectionList.length === 1 ? '' : 's'}` : 'No sections'}</td>
                      <td>{totalStudents}</td>
                      <td>{strand.status === 'archived' ? 'Archived' : 'Active'}</td>
                      <td>
                        <div className="inline-actions">
                          <button type="button" className="table-action-button" onClick={() => {
                            setSelectedStrandDetail(strand)
                            setActiveModal('strand-details')
                          }}>View</button>
                          <button type="button" className="table-action-button alt" onClick={() => handleArchiveStrand(strand.id)}>Archive</button>
                          <button
                            type="button"
                            className="table-action-button danger"
                            onClick={() => setPendingDelete({
                              type: 'strand',
                              id: strand.id,
                              name: strand.name,
                              sectionCount: sectionList.length,
                              studentCount: totalStudents,
                            })}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No strands found for this school year.</div>
            <button type="button" className="btn btn-primary btn-md" onClick={handleAddStrand}>+ Add Strand</button>
          </div>
        )}
      </Card>
    </div>
  )
}
