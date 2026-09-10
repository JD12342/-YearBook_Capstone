import { useEffect, useState } from 'react'
import { Button } from './Button.jsx'
import { Input } from './Input.jsx'
import { Modal } from './Modal.jsx'

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
    <Modal isOpen={isOpen} title={title} onClose={() => { if (!loading) onClose() }} panelClassName="delete-modal-panel">
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
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </form>
    </Modal>
  )
}
