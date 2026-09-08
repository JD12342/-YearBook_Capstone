import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createYearbook, getYearbooks } from '../../services/yearbookService.js'

export function YearbookManagementPage() {
  const [schoolYears, setSchoolYears] = useState([])
  const [yearbooks, setYearbooks] = useState([])
  const [title, setTitle] = useState('')
  const [schoolYearId, setSchoolYearId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [years, records] = await Promise.all([getSchoolYears(), getYearbooks()])
      setSchoolYears(years)
      setYearbooks(records)
      if (!schoolYearId && years[0]?.id) setSchoolYearId(years[0].id)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load data from Firebase.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!title.trim() || !schoolYearId) {
      setError('Please provide a title and school year.')
      return
    }

    setSaving(true)

    try {
      await createYearbook({
        title: title.trim(),
        schoolYearId,
        status: 'draft',
      })

      setTitle('')
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'Unable to create yearbook.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Yearbooks</div>
          <h2>Yearbook foundation</h2>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add Yearbook</Button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title="Create yearbook" onClose={() => setIsFormOpen(false)}>
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="form-field span-2">
              <span>Title</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Graduation Yearbook 2026-2027" required />
            </label>

            <label className="form-field">
              <span>School Year</span>
              <Select value={schoolYearId} onChange={(event) => setSchoolYearId(event.target.value)} required>
                <option value="">Select school year</option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </Select>
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Create Yearbook'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        <div className="widget-header">
          <h3>Yearbooks</h3>
          <span>{yearbooks.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading yearbooks...</div>
        ) : yearbooks.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>School Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {yearbooks.map((yearbook) => (
                  <tr key={yearbook.id}>
                    <td>{yearbook.title}</td>
                    <td>{schoolYears.find((year) => year.id === yearbook.schoolYearId)?.name || yearbook.schoolYearId || '—'}</td>
                    <td>{yearbook.status || 'draft'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No yearbooks created yet.</div>
        )}
      </Card>
    </div>
  )
}
