import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createStrand, getStrands } from '../../services/strandService.js'

export function StrandManagementPage() {
  const [schoolYears, setSchoolYears] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [strands, setStrands] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const years = await getSchoolYears()
      setSchoolYears(years)

      if (!selectedSchoolYearId && years[0]?.id) {
        setSelectedSchoolYearId(years[0].id)
      }

      if (selectedSchoolYearId || years[0]?.id) {
        const activeYearId = selectedSchoolYearId || years[0].id
        const records = await getStrands(activeYearId)
        setStrands(records)
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load data from Firebase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedSchoolYearId) return

    const loadStrands = async () => {
      setLoading(true)
      try {
        const records = await getStrands(selectedSchoolYearId)
        setStrands(records)
      } catch (loadError) {
        setError(loadError.message || 'Unable to load strands.')
      } finally {
        setLoading(false)
      }
    }

    loadStrands()
  }, [selectedSchoolYearId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedSchoolYearId || !name.trim()) {
      setError('Please select a school year and provide a strand name.')
      return
    }

    setSaving(true)

    try {
      await createStrand({
        name: name.trim(),
        code: code.trim() || name.trim(),
        schoolYearId: selectedSchoolYearId,
        status: 'active',
      })

      setName('')
      setCode('')
      const records = await getStrands(selectedSchoolYearId)
      setStrands(records)
    } catch (submitError) {
      setError(submitError.message || 'Unable to create strand.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Strands</div>
          <h2>Strand management</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Strand</Button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title="Create strand" onClose={() => setIsFormOpen(false)}>
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
              <span>Code</span>
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="STEM" />
            </label>

            <label className="form-field span-2">
              <span>Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Science, Technology, Engineering and Mathematics" required />
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Create Strand'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        <div className="widget-header">
          <h3>Strands</h3>
          <span>{strands.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading strands...</div>
        ) : strands.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {strands.map((strand) => (
                  <tr key={strand.id}>
                    <td>{strand.code || '—'}</td>
                    <td>{strand.name}</td>
                    <td>{strand.status || 'active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No strands created yet for this school year.</div>
        )}
      </Card>
    </div>
  )
}
