export function PlaceholderPage({ title, description }) {
  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">System</div>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="panel-card placeholder-card">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}
