import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { getSchoolYears, getStrands } from '../../services/schoolYearService.js'
import { createSection, getSections } from '../../services/sectionService.js'

export function SectionManagementPage() {
  const [schoolYears, setSchoolYears] = useState([])
  const [strands, setStrands] = useState([])
  const [sections, setSections] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [selectedStrandId, setSelectedStrandId] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    let ignore = false

    const loadSchoolYears = async () => {
      try {
        const years = await getSchoolYears()
        if (!ignore) {
          setSchoolYears(years)
          setSelectedSchoolYearId((current) => current || years[0]?.id || '')
        }
      } catch (loadError) {
        if (!ignore) setError(loadError.message || 'Unable to load school years.')
      }
    }

    loadSchoolYears()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadStrands = async () => {
      if (!selectedSchoolYearId) {
        if (!ignore) {
          setStrands([])
          setSelectedStrandId('')
        }
        return
      }

      try {
        const records = await getStrands(selectedSchoolYearId)
        if (!ignore) {
          setStrands(records)
          setSelectedStrandId((current) => {
            if (current && records.some((strand) => strand.id === current)) return current
            return records[0]?.id ?? ''
          })
        }
      } catch (loadError) {
        if (!ignore) setStrands([])
      }
    }

    loadStrands()

    return () => {
      ignore = true
    }
  }, [selectedSchoolYearId])

  useEffect(() => {
    let ignore = false

    const loadSections = async () => {
      if (!selectedSchoolYearId || !selectedStrandId) {
        if (!ignore) setSections([])
        return
      }

      try {
        const records = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
        if (!ignore) setSections(records)
      } catch (loadError) {
        if (!ignore) setSections([])
      }
    }

    loadSections()

    return () => {
      ignore = true
    }
  }, [selectedSchoolYearId, selectedStrandId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedSchoolYearId || !selectedStrandId || !name.trim()) {
      setError('Please select a school year, strand, and section name.')
      return
    }

    setSaving(true)

    try {
      await createSection({
        name: name.trim(),
        schoolYearId: selectedSchoolYearId,
        strandId: selectedStrandId,
        status: 'active',
      })

      setName('')
      const recordList = await getSections({ schoolYearId: selectedSchoolYearId, strandId: selectedStrandId })
      setSections(recordList)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Sections</div>
          <h2>Section management</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Section</Button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title="Create section" onClose={() => setIsFormOpen(false)}>
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="form-field">
              <span>School Year</span>
              <Select value={selectedSchoolYearId} onChange={(event) => setSelectedSchoolYearId(event.target.value)} required>
                <option value="">Select school year</option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field">
              <span>Strand</span>
              <Select value={selectedStrandId} onChange={(event) => setSelectedStrandId(event.target.value)} required>
                <option value="">Select strand</option>
                {strands.map((strand) => (
                  <option key={strand.id} value={strand.id}>{strand.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field span-2">
              <span>Section Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Section A" required />
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Create Section'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        <div className="widget-header">
          <h3>Sections</h3>
          <span>{sections.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading sections...</div>
        ) : sections.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>School Year</th>
                  <th>Strand</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.id}>
                    <td>{section.name}</td>
                    <td>{schoolYears.find((year) => year.id === section.schoolYearId)?.name || section.schoolYearId || '—'}</td>
                    <td>{strands.find((strand) => strand.id === section.strandId)?.name || section.strandId || '—'}</td>
                    <td>{section.status || 'active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No sections created yet for this strand.</div>
        )}
      </Card>
    </div>
  )
}
