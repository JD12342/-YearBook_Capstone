import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Modal({ isOpen, title, onClose, children, panelClassName = '' }) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  useEffect(() => {
    if (!isOpen) return undefined
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => { document.body.style.overflow = overflow; previous?.focus?.() }
  }, [isOpen])
  if (!isOpen) return null
  const handleKeys = event => {
    if (event.key === 'Escape') { event.stopPropagation(); closeRef.current?.() }
    if (event.key !== 'Tab') return
    const elements = [...panelRef.current.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length)
    const first = elements[0], last = elements.at(-1)
    if (!first) { event.preventDefault(); return }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) { event.preventDefault(); first.focus() }
  }
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={panelRef} className={('modal-panel ' + panelClassName).trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKeys} onClick={event => event.stopPropagation()}>
        <div className="modal-header"><h3 id={titleId}>{title}</h3><button type="button" className="modal-close" onClick={onClose} aria-label="Close form"><X size={20} /></button></div>
        {children}
      </div>
    </div>, document.body,
  )
}
