import { useEffect, useState } from 'react'
import { Button } from './Button.jsx'
import { Input } from './Input.jsx'

export function DeleteConfirmationModal({ isOpen, title, message, warning, onClose, onConfirm, loading = false }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!password.trim()) {
      setError('Enter your password to confirm deletion.')
      return
    }

    try {
      setError('')
      await onConfirm(password)
      setPassword('')
      onClose()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete. Please check your password and try again.')
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel delete-modal-panel">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close delete confirmation">
            ×
          </button>
        </div>

        <p className="delete-modal-copy">{message}</p>
        {warning && <div className="delete-warning">{warning}</div>}

        <form onSubmit={handleSubmit} className="delete-form">
          <label className="form-field span-2">
            <span>Admin password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
