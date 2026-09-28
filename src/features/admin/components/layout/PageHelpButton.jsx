import { useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'

export function PageHelpButton({ title, helpText, helpSections = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const helpRef = useRef(null)

  useEffect(() => {
    const closeHelp = (event) => {
      if (!helpRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeHelp)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeHelp)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className="page-help-control" ref={helpRef}>
      <button
        type="button"
        className="page-help-button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Help for ${title}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="page-help-popover" role="dialog" aria-label={`${title} help`}>
          <strong>About {title}</strong>
          <p>{helpText || 'Use this workspace to review and manage its related GradBook records.'}</p>
          {helpSections.length > 0 && <div className="page-help-sections">{helpSections.map((section) => <section key={section.title}><h4>{section.title}</h4><p>{section.text}</p></section>)}</div>}
        </div>
      )}
    </div>
  )
}
