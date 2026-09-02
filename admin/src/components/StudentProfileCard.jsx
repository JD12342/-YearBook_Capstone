export function StudentProfileCard({
  selectedStudent,
  selectedSchoolYear,
  selectedStrand,
  handleStartCamera,
  handleUploadExisting,
}) {
  if (!selectedStudent) return null

  return (
    <div className="student-card panel-card">
      <div className="student-meta">
        <div>
          <span className="label">Student</span>
          <h3>{selectedStudent.name}</h3>
        </div>
        <div>
          <span className="label">Status</span>
          <strong>{selectedStudent.status}</strong>
        </div>
        <div>
          <span className="label">School Year</span>
          <strong>{selectedSchoolYear.name}</strong>
        </div>
        <div>
          <span className="label">Strand</span>
          <strong>{selectedStrand?.name ?? '—'}</strong>
        </div>
        {selectedStudent.sectionId && (
          <div>
            <span className="label">Section</span>
            <strong>{selectedStudent.sectionId}</strong>
          </div>
        )}
      </div>

      <div className="action-row">
        <button className="primary-btn" onClick={handleStartCamera}>Start Camera</button>
        <label className="upload-btn">
          <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleUploadExisting} />
          Upload Existing Photo
        </label>
      </div>
    </div>
  )
}
