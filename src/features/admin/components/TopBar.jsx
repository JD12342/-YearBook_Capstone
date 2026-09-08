export function TopBar({ selectedSchoolYear, selectedStrand, retakeCount, photoStats }) {
  return (
    <header className="topbar panel">
      <div className="topbar-left">
        <div className="topbar-copy">
          <p className="eyebrow">Session</p>
          <h2>{selectedSchoolYear.name} • {selectedStrand?.name ?? 'No strand selected'}</h2>
        </div>
        <div className="status-strip">
          <span className="meta-pill">Completed {photoStats.completed}</span>
          <span className="meta-pill">Next in queue</span>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="queue-summary">
          <span>Retake needed: {retakeCount}</span>
        </div>
      </div>
    </header>
  )
}
