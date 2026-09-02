import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Select } from '../ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createYearbook, getYearbooks, updateYearbook } from '../../services/yearbookService.js'

export function YearbookManager() {
  const [schoolYears, setSchoolYears] = useState([])
  const [yearbooks, setYearbooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingYearbook, setEditingYearbook] = useState(null)
  const [form, setForm] = useState({ title: '', schoolYearId: '', status: 'draft' })

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [years, records] = await Promise.all([getSchoolYears(), getYearbooks()])
      setSchoolYears(years)
      setYearbooks(records)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load yearbooks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredYearbooks = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return yearbooks

    return yearbooks.filter((yearbook) => `${yearbook.title} ${yearbook.status}`.toLowerCase().includes(normalized))
  }, [yearbooks, searchTerm])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim() || !form.schoolYearId) {
      setError('Please provide a title and select a school year.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        schoolYearId: form.schoolYearId,
        status: form.status,
      }

      if (editingYearbook) {
        await updateYearbook(editingYearbook.id, payload)
      } else {
        await createYearbook(payload)
      }

      setForm({ title: '', schoolYearId: '', status: 'draft' })
      setEditingYearbook(null)
      setIsFormOpen(false)
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'Unable to save yearbook.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (yearbookId) => {
    try {
      await updateYearbook(yearbookId, { status: 'archived' })
      await loadData()
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive yearbook.')
    }
  }

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">Yearbooks</div>
          <h3>Yearbook foundation</h3>
        </div>
        <Button onClick={() => { setEditingYearbook(null); setForm({ title: '', schoolYearId: '', status: 'draft' }); setIsFormOpen(true) }}>+ Create Yearbook</Button>
      </div>

      <div className="toolbar-card">
        <div className="toolbar-search">
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search yearbooks..." />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title={editingYearbook ? 'Edit yearbook' : 'Create yearbook'} onClose={() => { setIsFormOpen(false); setEditingYearbook(null); setForm({ title: '', schoolYearId: '', status: 'draft' }) }}>
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="form-field span-2">
              <span>Title</span>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Graduation Yearbook 2026-2027" required />
            </label>

            <label className="form-field">
              <span>School Year</span>
              <Select value={form.schoolYearId} onChange={(event) => setForm((current) => ({ ...current, schoolYearId: event.target.value }))} required>
                <option value="">Select school year</option>
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </Select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </label>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setEditingYearbook(null); setForm({ title: '', schoolYearId: '', status: 'draft' }) }}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingYearbook ? 'Update Yearbook' : 'Create Yearbook'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading yearbooks...</div>
        ) : filteredYearbooks.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>School Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredYearbooks.map((yearbook) => (
                  <tr key={yearbook.id}>
                    <td>{yearbook.title}</td>
                    <td>{schoolYears.find((year) => year.id === yearbook.schoolYearId)?.name || yearbook.schoolYearId || '—'}</td>
                    <td><Badge status={yearbook.status === 'published' ? 'active' : yearbook.status === 'archived' ? 'archived' : 'pending'}>{yearbook.status || 'draft'}</Badge></td>
                    <td>
                      <div className="inline-actions">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingYearbook(yearbook); setForm({ title: yearbook.title, schoolYearId: yearbook.schoolYearId, status: yearbook.status || 'draft' }); setIsFormOpen(true) }}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleArchive(yearbook.id)}>Archive</Button>
                      </div>
                    </td>
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
