import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'

export function AddSectionModal({ isOpen, schoolYearName, strandName, form, onChange, onSubmit, onCancel, loading = false }) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} title="Add section" onClose={onCancel}>
      <form className="student-form" onSubmit={onSubmit}>
        <div className="field-grid">
          <label className="form-field span-2">
            <span>School Year</span>
            <Input value={schoolYearName || ''} readOnly />
          </label>

          <label className="form-field span-2">
            <span>Strand</span>
            <Input value={strandName || ''} readOnly />
          </label>

          <label className="form-field span-2">
            <span>Section Name</span>
            <Input value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Section A" required />
          </label>

          <label className="form-field span-2">
            <span>Section Code</span>
            <Input value={form.code} onChange={(event) => onChange('code', event.target.value)} placeholder="STEM-A" />
          </label>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Section'}</Button>
        </div>
      </form>
    </Modal>
  )
}
