import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'

const editingQueue = [
  { id: 1, student: 'Ana Garcia', schoolYear: '2026-2027', strand: 'HUMSS', source: 'Camera', status: 'In Progress' },
  { id: 2, student: 'Carmen Reyes', schoolYear: '2026-2027', strand: 'STEM', source: 'Existing Upload', status: 'Needs Editing' },
]

export function PhotoEditing() {
  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Photos</div>
          <h2>Photo Editing Queue</h2>
        </div>
      </div>

      <div className="stats-grid compact-grid">
        <div className="mini-stat-card"><div className="mini-stat-label">Needs Editing</div><div className="mini-stat-value">12</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">In Progress</div><div className="mini-stat-value">4</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Approved</div><div className="mini-stat-value">20</div></div>
        <div className="mini-stat-card"><div className="mini-stat-label">Retake Needed</div><div className="mini-stat-value">3</div></div>
      </div>

      <Card className="panel-card">
        <DataTable
          columns={[
            { key: 'student', label: 'Student' },
            { key: 'schoolYear', label: 'School Year' },
            { key: 'strand', label: 'Strand' },
            { key: 'source', label: 'Source' },
            { key: 'status', label: 'Status', type: 'status' },
            {
              key: 'action',
              label: 'Action',
              render: () => <button type="button" className="text-button">Open</button>,
            },
          ]}
          rows={editingQueue}
          emptyMessage="No photos currently in the editing queue."
        />
      </Card>
    </div>
  )
}
