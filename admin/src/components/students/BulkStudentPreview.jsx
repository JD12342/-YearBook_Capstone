import { Button } from '../ui/Button.jsx'

export function BulkStudentPreview({ rows = [], onCancel, onConfirm, importing = false }) {
  const totalRows = rows.length
  const validRows = rows.filter((row) => row.valid).length
  const invalidRows = totalRows - validRows
  const duplicateRows = rows.filter((row) => row.validation === 'Duplicate').length

  return (
    <div className="student-import-preview">
      <div className="bulk-summary">
        <div><span>Total rows</span><strong>{totalRows}</strong></div>
        <div><span>Valid rows</span><strong>{validRows}</strong></div>
        <div><span>Invalid rows</span><strong>{invalidRows}</strong></div>
        <div><span>Duplicate rows</span><strong>{duplicateRows}</strong></div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table compact-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student No.</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Validation</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={`${row.index}-${row.studentNumber}`}>
                <td>{row.index}</td>
                <td>{row.studentNumber || '—'}</td>
                <td>{row.firstName || '—'}</td>
                <td>{row.lastName || '—'}</td>
                <td><span className={`bulk-status ${row.valid ? 'ready' : 'invalid'}`}>{row.validation}</span></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="empty-state">No preview data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={onConfirm} disabled={importing || !validRows}> {importing ? 'Importing...' : 'Import Valid Students'} </Button>
      </div>
    </div>
  )
}
