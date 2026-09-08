export function SidebarPanel({
  selectedSchoolYearId,
  schoolYears,
  availableStrands,
  selectedStrand,
  handleSchoolYearChange,
  handleStrandChange,
  students,
  selectedStudent,
  selectedSchoolYear,
  handleStudentSelect,
  searchTerm,
  setSearchTerm,
  sectionOptions,
  sectionFilter,
  setSectionFilter,
  pendingCapture,
  capturedCount,
  approvedCount,
  visibleStudents,
  navItems,
  activePage,
  onPageSelect,
}) {
  return (
    <aside className="sidebar panel">
      <div className="brand-block">
        <div className="brand-mark">G</div>
        <div>
          <p className="eyebrow">GradBook</p>
          <h1>Photo Admin</h1>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Sidebar navigation">
        <div className="menu-group-label">Navigation</div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-menu-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageSelect(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="field-group">
        <label className="field">
          <span>School Year</span>
          <select
            value={selectedSchoolYearId}
            onChange={(event) => handleSchoolYearChange(event.target.value)}
          >
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="sidebar-section">
        <div className="section-heading">
          <span>Strands</span>
          <strong>{selectedSchoolYear?.name}</strong>
        </div>
        <div className="strand-grid">
          {availableStrands.map((strand) => (
            <button
              key={strand.id}
              className={`strand-pill ${selectedStrand?.id === strand.id ? 'active' : ''}`}
              onClick={() => handleStrandChange(strand.id)}
            >
              <strong>{strand.name}</strong>
              <small>{students.filter((student) => student.schoolYearId === selectedSchoolYearId && student.strandId === strand.id).length} students</small>
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span>Total</span>
          <strong>{visibleStudents.length}</strong>
        </div>
        <div className="stat-box">
          <span>Pending</span>
          <strong>{pendingCapture}</strong>
        </div>
        <div className="stat-box">
          <span>Captured</span>
          <strong>{capturedCount}</strong>
        </div>
        <div className="stat-box">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="student-controls">
          <input
            type="text"
            placeholder="Search students"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {sectionOptions.length > 0 && (
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)}>
              <option value="all">All sections</option>
              {sectionOptions.map((section) => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="list-box">
        {visibleStudents.map((student) => (
          <button
            key={student.id}
            className={`student-row ${selectedStudent?.id === student.id ? 'selected' : ''}`}
            onClick={() => handleStudentSelect(student.id)}
          >
            <div>
              <strong>{student.name}</strong>
              <small>{student.sectionId ? `Section ${student.sectionId}` : 'No section'}</small>
            </div>
            <span className={`status-badge ${student.status}`}>{student.status}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
