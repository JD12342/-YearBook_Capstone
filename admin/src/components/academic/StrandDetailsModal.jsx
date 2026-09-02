import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

export function StrandDetailsModal({ isOpen, strand, schoolYearName, onClose, onAddSection, onViewStudents, onArchiveSection, onDeleteSection, loading = false }) {
  if (!isOpen || !strand) return null

  return (
    <Modal isOpen={isOpen} title="Strand details" onClose={onClose}>
      <div className="strand-detail-panel">
        <div className="strand-detail-header">
          <div>
            <div className="page-kicker">Strand</div>
            <h3>{strand.name}</h3>
            <p>{schoolYearName || 'School year'} • {strand.code || 'No code'}</p>
          </div>
        </div>

        <div className="detail-toolbar-row">
          <div className="detail-heading">Sections</div>
          <Button onClick={onAddSection}>+ Add Section</Button>
        </div>

        {strand.sections?.length ? (
          <div className="data-table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {strand.sections.map((section) => (
                  <tr key={section.id}>
                    <td>{section.name}</td>
                    <td>{section.studentsCount ?? 0} students</td>
                    <td>{section.status === 'archived' ? 'Archived' : 'Active'}</td>
                    <td>
                      <div className="inline-actions">
                        <button type="button" className="table-action-button" onClick={() => onViewStudents(section.id)}>View Students</button>
                        <button type="button" className="table-action-button alt" onClick={() => onArchiveSection(section.id)}>Archive</button>
                        <button type="button" className="table-action-button danger" onClick={() => onDeleteSection(section.id, section.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No sections found.</div>
            <Button onClick={onAddSection}>+ Add Section</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
