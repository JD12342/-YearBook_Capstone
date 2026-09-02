export function StatCard({ title, value, description, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {trend ? <span className="stat-card-trend">{trend}</span> : null}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-icon">{icon}</div>
        <div>
          <div className="stat-card-value">{value}</div>
          <div className="stat-card-description">{description}</div>
        </div>
      </div>
    </div>
  )
}
