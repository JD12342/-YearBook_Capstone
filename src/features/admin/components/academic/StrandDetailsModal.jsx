import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

export function StrandDetailsModal({ isOpen, strand, schoolYearName, onClose, onAddSection, onViewStudents, onArchiveSection, onDeleteSection, onSaveSectionOrder, loading = false }) {
  const [isReordering, setIsReordering] = useState(false)
  const [draggedSectionId, setDraggedSectionId] = useState(null)
  const [savingOrder, setSavingOrder] = useState(false)
  if (!isOpen || !strand) return null

  const moveSection = async (targetId) => {
    if (!draggedSectionId || draggedSectionId === targetId) return
    const nextSections = [...(strand.sections ?? [])]
    const fromIndex = nextSections.findIndex((section) => section.id === draggedSectionId)
    const toIndex = nextSections.findIndex((section) => section.id === targetId)
    if (fromIndex < 0 || toIndex < 0) return
    const [moved] = nextSections.splice(fromIndex, 1)
    nextSections.splice(toIndex, 0, moved)
    setSavingOrder(true)
    try {
      await onSaveSectionOrder(nextSections)
    } finally {
      setSavingOrder(false)
      setDraggedSectionId(null)
    }
  }

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
          <div className="detail-toolbar-actions">
            <Button size="sm" variant="secondary" onClick={() => setIsReordering((active) => !active)}>{isReordering ? 'Done arranging' : 'Arrange order'}</Button>
            <Button onClick={onAddSection}>+ Add Section</Button>
          </div>
        </div>

        {isReordering && <div className="reorder-hint">Drag sections into their preferred order. Each drop is saved automatically.</div>}

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
                  <tr
                    key={section.id}
                    className={isReordering ? 'reorder-row' : ''}
                    draggable={isReordering && !savingOrder}
                    onDragStart={() => setDraggedSectionId(section.id)}
                    onDragOver={(event) => { if (isReordering) event.preventDefault() }}
                    onDrop={() => moveSection(section.id)}
                    onDragEnd={() => setDraggedSectionId(null)}
                  >
                    <td><span className="reorder-name">{isReordering && <GripVertical className="reorder-handle" size={17} aria-hidden="true" />}{section.name}</span></td>
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
