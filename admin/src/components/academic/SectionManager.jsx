import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Select } from '../ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createSection, getSections, updateSection } from '../../services/sectionService.js'
import { getStrands } from '../../services/strandService.js'

export function SectionManager() {
  const [schoolYears, setSchoolYears] = useState([])
  const [strands, setStrands] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [selectedStrandId, setSelectedStrandId] = useState('')
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({ schoolYearId: '', strandId: '', name: '', status: 'active' })

  const loadSchoolYearOptions = async () => {
    const years = await getSchoolYears()
    setSchoolYears(years)
    if (!selectedSchoolYearId && years[0]?.id) {
      setSelectedSchoolYearId(years[0].id)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        await loadSchoolYearOptions()
      } catch (loadError) {
        setError(loadError.message || 'Unable to load school years.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!selectedSchoolYearId) {
      setStrands([])
      setSelectedStrandId('')
      return
    }

    const loadStrands = async () => {
      const records = await getStrands(selectedSchoolYearId)
      setStrands(records)
      if (!records.some((strand) => strand.id === selectedStrandId)) {
        setSelectedStrandId('')
      }
    }

    loadStrands()
  }, [selectedSchoolYearId])

  useEffect(() => {
    if (!selectedSchoolYearId && !selectedStrandId) {
      setSections([])
      return
    }

    const loadSections = async () => {
      setLoading(true)
      try {
        const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
        setSections(records)
      } catch (loadError) {
        setError(loadError.message || 'Unable to load sections.')
      } finally {
        setLoading(false)
      }
    }

    loadSections()
  }, [selectedSchoolYearId, selectedStrandId])

  const filteredSections = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return sections

    return sections.filter((section) => `${section.name} ${section.schoolYearId} ${section.strandId}`.toLowerCase().includes(normalized))
  }, [sections, searchTerm])

  const handleSchoolYearChange = (nextSchoolYearId) => {
    setSelectedSchoolYearId(nextSchoolYearId)
    setSelectedStrandId('')
    setForm((current) => ({ ...current, schoolYearId: nextSchoolYearId, strandId: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.schoolYearId || !form.strandId || !form.name.trim()) {
      setError('Please select a school year, strand, and section name.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        schoolYearId: form.schoolYearId,
        strandId: form.strandId,
        name: form.name.trim(),
        status: form.status,
      }

      if (editingSection) {
        await updateSection(editingSection.id, payload)
      } else {
        await createSection(payload)
      }

      setIsFormOpen(false)
      setEditingSection(null)
      setForm({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId, name: '', status: 'active' })
      const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
      setSections(records)
    } catch (submitError) {
      setError(submitError.message || 'Unable to save section.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (sectionId) => {
    try {
      await updateSection(sectionId, { status: 'archived' })
      const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
      setSections(records)
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive section.')
    }
  }

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">Sections</div>
          <h3>Academic sections</h3>
        </div>
        <Button onClick={() => { setEditingSection(null); setForm({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId, name: '', status: 'active' }); setIsFormOpen(true) }}>+ Add Section</Button>
      </div>

      <div className="toolbar-card toolbar-grid">
        <label className="filter-field">
          <span>School Year</span>
          <Select value={selectedSchoolYearId} onChange={(event) => handleSchoolYearChange(event.target.value)}>
            <option value="">Select school year</option>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </Select>
        </label>

        <label className="filter-field">
          <span>Strand</span>
          <Select value={selectedStrandId} onChange={(event) => { setSelectedStrandId(event.target.value); setForm((current) => ({ ...current, strandId: event.target.value })) }}>
            <option value="">All strands</option>
            {strands.map((strand) => (
              <option key={strand.id} value={strand.id}>{strand.name}</option>
            ))}
          </Select>
        </label>

        <div className="toolbar-search">
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search sections..." />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title={editingSection ? 'Edit section' : 'Create section'} onClose={() => { setIsFormOpen(false); setEditingSection(null) }}>
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="form-field">
              <span>School Year</span>
              <Select value={form.schoolYearId} onChange={(event) => setForm((current) => ({ ...current, schoolYearId: event.target.value, strandId: '' }))} required>
                <option value="">Select school year</option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field">
              <span>Strand</span>
              <Select value={form.strandId} onChange={(event) => setForm((current) => ({ ...current, strandId: event.target.value }))} required>
                <option value="">Select strand</option>
                {strands.filter((strand) => strand.schoolYearId === form.schoolYearId).map((strand) => (
                  <option key={strand.id} value={strand.id}>{strand.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field span-2">
              <span>Section Name</span>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Section A" required />
            </label>

            <label className="form-field span-2">
              <span>Status</span>
              <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setEditingSection(null) }}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading sections...</div>
        ) : filteredSections.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>School year</th>
                  <th>Strand</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((section) => (
                  <tr key={section.id}>
                    <td>{section.name}</td>
                    <td>{schoolYears.find((year) => year.id === section.schoolYearId)?.name || section.schoolYearId || '—'}</td>
                    <td>{strands.find((strand) => strand.id === section.strandId)?.name || section.strandId || '—'}</td>
                    <td><Badge status={section.status === 'active' ? 'active' : 'archived'}>{section.status || 'active'}</Badge></td>
                    <td>
                      <div className="inline-actions">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingSection(section); setForm({ schoolYearId: section.schoolYearId, strandId: section.strandId, name: section.name, status: section.status || 'active' }); setIsFormOpen(true) }}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleArchive(section.id)}>Archive</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No sections found.</div>
        )}
      </Card>
    </div>
  )
}
