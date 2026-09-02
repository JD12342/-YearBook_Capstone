export function SessionsPage({ students, selectedSchoolYear, selectedStrand }) {
  const sessionRows = students.filter((student) => student.schoolYearId === selectedSchoolYear.id && (selectedStrand ? student.strandId === selectedStrand.id : true))

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="section-kicker">Sessions</span>
          <h2>Capture sessions</h2>
        </div>
      </div>

      <article className="table-card panel-card">
        <div className="widget-header">
          <h3>{selectedSchoolYear.name}</h3>
          <span className="trend">{selectedStrand?.name ?? 'All strands'}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Strand</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessionRows.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{selectedStrand?.name ?? student.strandId}</td>
                <td>{student.sectionId ?? '—'}</td>
                <td><span className={`table-status ${student.status}`}>{student.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  )
}
