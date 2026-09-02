export function OverviewPage({ visibleStudents, capturedCount, pendingCapture, approvedCount, recentSessions, completionPercent }) {
  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="section-kicker">Dashboard</span>
          <h2>Yearbook overview</h2>
        </div>
      </div>

      <div className="analytics-grid">
        <article className="summary-card">
          <div className="card-headline">
            <span>Student portraits</span>
            <span className="trend">+8.2%</span>
          </div>
          <div className="team-row">
            <div className="avatar-stack">
              <div className="avatar avatar-a">A</div>
              <div className="avatar avatar-b">M</div>
              <div className="avatar avatar-c">J</div>
            </div>
            <div className="stat-inline">
              <strong>{visibleStudents.length}</strong>
              <small>Active</small>
            </div>
          </div>
          <div className="mini-chart">
            <span></span>
            <span></span>
            <span></span>
            <span className="active"></span>
            <span></span>
          </div>
        </article>

        <article className="summary-card">
          <div className="card-headline">
            <span>Captured</span>
            <span className="trend">+12.4%</span>
          </div>
          <div className="amount-block">
            <strong>{capturedCount}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="card-headline">
            <span>Pending</span>
            <span className="trend">+4.8%</span>
          </div>
          <div className="bar-chart">
            <span style={{ height: '25%' }}></span>
            <span style={{ height: '48%' }}></span>
            <span style={{ height: '33%' }}></span>
            <span style={{ height: '72%' }}></span>
            <span style={{ height: '100%' }}></span>
            <span style={{ height: '60%' }}></span>
          </div>
        </article>
      </div>

      <div className="content-grid">
        <article className="widget panel-card">
          <div className="widget-header">
            <h3>Recent sessions</h3>
            <button type="button" className="link-btn">View all</button>
          </div>
          <div className="payment-list">
            {recentSessions.map((item) => (
              <div key={item.name} className="payment-row">
                <div className="person-block">
                  <div className="tiny-avatar">{item.name.charAt(0)}</div>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.date}</small>
                  </div>
                </div>
                <div className="payment-meta">
                  <span className="amount-text">{item.photo}</span>
                  <span className={`payment-status ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="widget panel-card compact">
          <div className="widget-header">
            <h3>Completion</h3>
            <button type="button" className="link-btn">This month</button>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart">
              <span>{completionPercent}%</span>
            </div>
          </div>
        </article>
      </div>

      <article className="table-card panel-card">
        <div className="widget-header">
          <h3>Student submissions</h3>
          <input type="text" placeholder="Search student" className="search-input" />
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Photo type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Erina James', 'Portrait', 'Approved', 'Feb 18, 2023', 'Ready for yearbook'],
              ['Ari Daniels', 'Retake', 'Pending', 'Feb 20, 2023', 'Needs reshoot'],
              ['Della Harris', 'Group Shot', 'Approved', 'Apr 11, 2023', 'Final approval'],
            ].map(([name, type, status, date, notes]) => (
              <tr key={name}>
                <td>
                  <div className="person-block small-person">
                    <div className="tiny-avatar accent">{name.charAt(0)}</div>
                    <span>{name}</span>
                  </div>
                </td>
                <td>{type}</td>
                <td><span className={`table-status ${status.toLowerCase()}`}>{status}</span></td>
                <td>{date}</td>
                <td>{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
