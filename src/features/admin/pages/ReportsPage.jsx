export function ReportsPage({ visibleStudents, capturedCount, approvedCount, pendingCapture, retakeCount }) {
  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="section-kicker">Reports</span>
          <h2>Performance summary</h2>
        </div>
      </div>

      <div className="analytics-grid">
        <article className="summary-card">
          <div className="card-headline"><span>Total students</span></div>
          <div className="amount-block"><strong>{visibleStudents.length}</strong></div>
        </article>
        <article className="summary-card">
          <div className="card-headline"><span>Approved</span></div>
          <div className="amount-block"><strong>{approvedCount}</strong></div>
        </article>
        <article className="summary-card">
          <div className="card-headline"><span>Retakes</span></div>
          <div className="amount-block"><strong>{retakeCount}</strong></div>
        </article>
      </div>

      <div className="content-grid single-column">
        <article className="panel-card compact-panel">
          <div className="widget-header">
            <h3>Status breakdown</h3>
          </div>
          <div className="report-list">
            <div className="report-row"><span>Pending</span><strong>{pendingCapture}</strong></div>
            <div className="report-row"><span>Captured</span><strong>{capturedCount}</strong></div>
            <div className="report-row"><span>Approved</span><strong>{approvedCount}</strong></div>
          </div>
        </article>
      </div>
    </section>
  )
}
