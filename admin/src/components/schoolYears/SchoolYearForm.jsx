import { useEffect, useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'

const defaultForm = {
  name: '',
  startYear: new Date().getFullYear(),
  endYear: new Date().getFullYear() + 1,
  status: 'active',
}

export function SchoolYearForm({ schoolYear = null, onSubmit, onCancel }) {
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (schoolYear) {
      setForm({
        name: schoolYear.name ?? '',
        startYear: schoolYear.startYear ?? new Date().getFullYear(),
        endYear: schoolYear.endYear ?? new Date().getFullYear() + 1,
        status: schoolYear.status ?? 'active',
      })
      return
    }

    setForm(defaultForm)
  }, [schoolYear])

  const handleChange = (field) => (event) => {
    const value = field === 'startYear' || field === 'endYear' ? Number(event.target.value) : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.(form)
  }

  return (
    <form className="student-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label className="form-field span-2">
          <span>School Year Name</span>
          <Input value={form.name} onChange={handleChange('name')} placeholder="2026-2027" required />
        </label>

        <label className="form-field">
          <span>Start Year</span>
          <Input value={form.startYear} type="number" min="2000" max="2100" onChange={handleChange('startYear')} required />
        </label>

        <label className="form-field">
          <span>End Year</span>
          <Input value={form.endYear} type="number" min="2001" max="2200" onChange={handleChange('endYear')} required />
        </label>

        <label className="form-field span-2">
          <span>Status</span>
          <Select value={form.status} onChange={handleChange('status')}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </label>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{schoolYear ? 'Update School Year' : 'Create School Year'}</Button>
      </div>
    </form>
  )
}
