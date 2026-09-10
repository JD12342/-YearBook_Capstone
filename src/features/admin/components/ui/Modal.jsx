export function Modal({ isOpen, title, onClose, children, panelClassName = '' }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-panel ${panelClassName}`.trim()} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close form">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
