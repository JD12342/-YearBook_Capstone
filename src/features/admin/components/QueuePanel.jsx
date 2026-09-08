export function QueuePanel({ title, items, variant = 'capture', onSelect, selectedStudentId, students }) {
  return (
    <div className="queue-panel panel-card">
      <div className="queue-header">
        <h3>{title}</h3>
        <span>{items.length} items</span>
      </div>

      <div className="queue-list">
        {items.map((item) => {
          const student = variant === 'editing' ? students.find((entry) => entry.id === item.studentId) : students.find((entry) => entry.id === item.id)
          return (
            <button
              key={variant === 'editing' ? item.id : item.id}
              className={`queue-item ${selectedStudentId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id || item.studentId)}
            >
              <span>{student?.name ?? 'Student'}</span>
              <strong>{variant === 'editing' ? item.status : item.status}</strong>
            </button>
          )
        })}
      </div>
    </div>
  )
}
