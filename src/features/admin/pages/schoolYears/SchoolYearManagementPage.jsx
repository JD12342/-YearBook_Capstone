import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { SchoolYearForm } from '../../components/schoolYears/SchoolYearForm.jsx'
import { createSchoolYear, getSchoolYears, updateSchoolYear } from '../../services/schoolYearService.js'

export function SchoolYearManagementPage() {
  const [schoolYears, setSchoolYears] = useState([])
  const [editingSchoolYear, setEditingSchoolYear] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSchoolYears = async () => {
    setLoading(true)
    try {
      const records = await getSchoolYears()
      setSchoolYears(records)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchoolYears()
  }, [])

  const handleSubmit = async (payload) => {
    try {
      if (editingSchoolYear) {
        await updateSchoolYear(editingSchoolYear.id, payload)
      } else {
        await createSchoolYear(payload)
      }

      setIsFormOpen(false)
      setEditingSchoolYear(null)
      setError('')
      await loadSchoolYears()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">School Years</div>
          <h2>School year management</h2>
        </div>
        <Button onClick={() => { setEditingSchoolYear(null); setIsFormOpen(true) }}>Add School Year</Button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <Modal isOpen={isFormOpen} title={editingSchoolYear ? 'Edit school year' : 'Create school year'} onClose={() => { setIsFormOpen(false); setEditingSchoolYear(null) }}>
        <SchoolYearForm
          schoolYear={editingSchoolYear}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingSchoolYear(null) }}
        />
      </Modal>

      <Card className="panel-card">
        <div className="widget-header">
          <h3>School years</h3>
          <span>{schoolYears.length} records</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading school years...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schoolYears.map((schoolYear) => (
                  <tr key={schoolYear.id}>
                    <td>{schoolYear.name}</td>
                    <td>{schoolYear.startYear} - {schoolYear.endYear}</td>
                    <td><Badge status={schoolYear.status === 'active' ? 'active' : 'archived'}>{schoolYear.status || 'active'}</Badge></td>
                    <td>
                      <div className="inline-actions">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingSchoolYear(schoolYear); setIsFormOpen(true) }}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
