import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'

const retakes = [
  { id: 1, student: 'Juan Dela Cruz', schoolYear: '2026-2027', strand: 'STEM', reason: 'Poor lighting', action: 'Retake' },
  { id: 2, student: 'Maria Santos', schoolYear: '2026-2027', strand: 'GAS', reason: 'Face too shadowed', action: 'Retake' },
]

export function PhotoRetakes() {
  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Photos</div>
          <h2>Retake Queue</h2>
        </div>
      </div>

      <Card className="panel-card">
        <DataTable
          columns={[
            { key: 'student', label: 'Student' },
            { key: 'schoolYear', label: 'School Year' },
            { key: 'strand', label: 'Strand' },
            { key: 'reason', label: 'Reason' },
            {
              key: 'action',
              label: 'Action',
              render: (value) => <button type="button" className="btn btn-secondary btn-sm">{value}</button>,
            },
          ]}
          rows={retakes}
          emptyMessage="No retake requests right now."
        />
      </Card>
    </div>
  )
}
