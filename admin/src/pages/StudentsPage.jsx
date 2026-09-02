export function StudentsPage({ visibleStudents, selectedStudent, selectedSchoolYear, selectedStrand, handleStudentSelect, searchTerm, setSearchTerm, sectionOptions, sectionFilter, setSectionFilter }) {
  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="section-kicker">Students</span>
          <h2>Student directory</h2>
        </div>
      </div>

      <div className="student-page-grid">
        <article className="panel-card compact-panel">
          <div className="widget-header">
            <h3>Search</h3>
          </div>
          <div className="student-filter-stack">
            <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search students" className="search-input wide" />
            {sectionOptions.length > 0 && (
              <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="table-select">
                <option value="all">All sections</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            )}
          </div>

          <div className="list-box compact-list">
            {visibleStudents.map((student) => (
              <button key={student.id} className={`student-row ${selectedStudent?.id === student.id ? 'selected' : ''}`} onClick={() => handleStudentSelect(student.id)}>
                <div>
                  <strong>{student.name}</strong>
                  <small>{student.sectionId ? `Section ${student.sectionId}` : 'No section'}</small>
                </div>
                <span className={`status-badge ${student.status}`}>{student.status}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel-card compact-panel">
          <div className="widget-header">
            <h3>Selected student</h3>
          </div>

          {selectedStudent ? (
            <div className="student-profile-box">
              <div className="student-profile-header">
                <div className="profile-avatar">{selectedStudent.name.charAt(0)}</div>
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p>{selectedSchoolYear?.name}</p>
                </div>
              </div>

              <div className="student-metrics">
                <div>
                  <span>Strand</span>
                  <strong>{selectedStrand?.name ?? '—'}</strong>
                </div>
                <div>
                  <span>Section</span>
                  <strong>{selectedStudent.sectionId ?? '—'}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{selectedStudent.status}</strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="empty-state">No student is selected.</p>
          )}
        </article>
      </div>
    </section>
  )
}
