import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Card } from '../ui/Card.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Select } from '../ui/Select.jsx'
import { getSchoolYears } from '../../services/schoolYearService.js'
import { createStrand, getStrands, updateStrand } from '../../services/strandService.js'

export function StrandManager() {
  const [schoolYears, setSchoolYears] = useState([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState('')
  const [strands, setStrands] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStrand, setEditingStrand] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', status: 'active', schoolYearId: '' })

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const years = await getSchoolYears()
      setSchoolYears(years)

      const activeYearId = selectedSchoolYearId || years[0]?.id || ''
      if (activeYearId) {
        setSelectedSchoolYearId(activeYearId)
        const records = await getStrands(activeYearId)
        setStrands(records)
      } else {
        setStrands([])
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load strands.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedSchoolYearId) {
      setStrands([])
      return
    }

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

  const filteredStrands = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return strands

    return strands.filter((strand) => `${strand.name} ${strand.code}`.toLowerCase().includes(normalized))
  }, [searchTerm, strands])

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      status: 'active',
      schoolYearId: selectedSchoolYearId,
    })
  }

  const openCreate = () => {
    setEditingStrand(null)
    setForm({ name: '', code: '', status: 'active', schoolYearId: selectedSchoolYearId })
    setIsFormOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.schoolYearId || !form.name.trim()) {
      setError('Please select a school year and provide a strand name.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || form.name.trim(),
        schoolYearId: form.schoolYearId,
        status: form.status,
      }

      if (editingStrand) {
        await updateStrand(editingStrand.id, payload)
      } else {
        await createStrand(payload)
      }

      setIsFormOpen(false)
      resetForm()
      setEditingStrand(null)
      const records = await getStrands(form.schoolYearId)
      setStrands(records)
    } catch (submitError) {
      setError(submitError.message || 'Unable to save strand.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (strandId) => {
    try {
      await updateStrand(strandId, { status: 'archived' })
      const records = await getStrands(selectedSchoolYearId)
      setStrands(records)
    } catch (submitError) {
      setError(submitError.message || 'Unable to archive strand.')
    }
  }

  return (
    <div className="manager-panel">
      <div className="manager-toolbar">
        <div>
          <div className="page-kicker">Strands</div>
          <h3>Academic strands</h3>
        </div>
        <Button onClick={openCreate}>+ Add Strand</Button>
      </div>

      <div className="toolbar-card toolbar-grid">
        <label className="filter-field">
          <span>School Year</span>
          <Select value={selectedSchoolYearId} onChange={(event) => setSelectedSchoolYearId(event.target.value)}>
            <option value="">All school years</option>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </Select>
        </label>
        <div className="toolbar-search">
          <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search strands..." />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title={editingStrand ? 'Edit strand' : 'Create strand'} onClose={() => { setIsFormOpen(false); setEditingStrand(null); resetForm() }}>
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="field-grid">
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
              <span>Strand Code</span>
              <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="STEM" />
            </label>

            <label className="form-field span-2">
              <span>Strand Name</span>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Science, Technology, Engineering and Mathematics" required />
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
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setEditingStrand(null); resetForm() }}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingStrand ? 'Update Strand' : 'Create Strand'}</Button>
          </div>
        </form>
      </Modal>

      <Card className="panel-card">
        {loading ? (
          <div className="empty-state">Loading strands...</div>
        ) : filteredStrands.length ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>School Year</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrands.map((strand) => (
                  <tr key={strand.id}>
                    <td>{strand.code || '—'}</td>
                    <td>{strand.name}</td>
                    <td>{schoolYears.find((year) => year.id === strand.schoolYearId)?.name || strand.schoolYearId || '—'}</td>
                    <td><Badge status={strand.status === 'active' ? 'active' : 'archived'}>{strand.status || 'active'}</Badge></td>
                    <td>
                      <div className="inline-actions">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingStrand(strand); setForm({ name: strand.name, code: strand.code || '', status: strand.status || 'active', schoolYearId: strand.schoolYearId }); setIsFormOpen(true) }}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleArchive(strand.id)}>Archive</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No strands found for this school year.</div>
        )}
      </Card>
    </div>
  )
}
