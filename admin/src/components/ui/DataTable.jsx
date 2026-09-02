import { Badge } from './Badge.jsx'

export function DataTable({ columns = [], rows = [], emptyMessage = 'No records found.' }) {
  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No data available</div>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key ?? column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex}>
              {columns.map((column) => {
                const value = row[column.key]
                if (column.render) return <td key={`${column.key}-${rowIndex}`}>{column.render(value, row)}</td>

                if (column.type === 'status') {
                  return (
                    <td key={`${column.key}-${rowIndex}`}>
                      <Badge status={value}>{value}</Badge>
                    </td>
                  )
                }

                return <td key={`${column.key}-${rowIndex}`}>{value ?? '-'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
