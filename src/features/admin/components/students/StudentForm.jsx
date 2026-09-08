import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'

const defaultForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  studentNumber: '',
  schoolYearId: '',
  strandId: '',
  sectionId: '',
  status: 'active',
}

export function StudentForm({ student = null, schoolYears = [], strands = [], sections = [], defaultSchoolYearId = '', defaultStrandId = '', defaultSectionId = '', onSubmit, onCancel, submitLabel = 'Save' }) {
  const [form, setForm] = useState(defaultForm)

  const availableSections = useMemo(() => {
    return sections.filter((section) => (
      section.schoolYearId === form.schoolYearId && section.strandId === form.strandId
    ))
  }, [form.schoolYearId, form.strandId, sections])

  useEffect(() => {
    const nextSchoolYearId = defaultSchoolYearId || schoolYears[0]?.id || ''
    const nextStrandId = defaultStrandId || strands.filter((strand) => strand.schoolYearId === nextSchoolYearId)[0]?.id || (strands[0]?.id ?? '')
    const nextSectionId = defaultSectionId || sections.find((section) => section.schoolYearId === nextSchoolYearId && section.strandId === nextStrandId)?.id || ''

    if (!student) {
      setForm({
        ...defaultForm,
        schoolYearId: nextSchoolYearId,
        strandId: nextStrandId,
        sectionId: nextSectionId,
      })
      return
    }

    const studentSchoolYearId = student.schoolYearId ?? nextSchoolYearId
    const studentStrandId = student.strandId ?? (strands.filter((strand) => strand.schoolYearId === studentSchoolYearId)[0]?.id ?? '')

    setForm({
      firstName: student.firstName ?? '',
      middleName: student.middleName ?? '',
      lastName: student.lastName ?? '',
      suffix: student.suffix ?? '',
      studentNumber: student.studentNumber ?? '',
      schoolYearId: studentSchoolYearId,
      strandId: studentStrandId,
      sectionId: student.sectionId ?? '',
      status: student.status ?? 'active',
    })
  }, [schoolYears, strands, sections, student, defaultSchoolYearId, defaultStrandId, defaultSectionId])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'schoolYearId') {
        const firstStrandForYear = strands.filter((strand) => strand.schoolYearId === value)[0]?.id ?? ''
        next.strandId = firstStrandForYear
        next.sectionId = sections.find((section) => section.schoolYearId === value && section.strandId === firstStrandForYear)?.id ?? ''
      }

      if (field === 'strandId') {
        const sectionValues = sections.filter((section) => section.schoolYearId === current.schoolYearId && section.strandId === value)
        next.sectionId = sectionValues.some((section) => section.id === current.sectionId) ? current.sectionId : (sectionValues[0]?.id ?? '')
      }

      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      studentNumber: form.studentNumber.trim(),
    })
  }

  return (
    <form className="student-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label className="form-field">
          <span>First Name</span>
          <Input required value={form.firstName} onChange={handleChange('firstName')} />
        </label>

        <label className="form-field">
          <span>Middle Name</span>
          <Input value={form.middleName} onChange={handleChange('middleName')} placeholder="Optional" />
        </label>

        <label className="form-field">
          <span>Last Name</span>
          <Input required value={form.lastName} onChange={handleChange('lastName')} />
        </label>

        <label className="form-field">
          <span>Suffix</span>
          <Input value={form.suffix} onChange={handleChange('suffix')} placeholder="Optional" />
        </label>

        <label className="form-field span-2">
          <span>Student Number</span>
          <Input required value={form.studentNumber} onChange={handleChange('studentNumber')} placeholder="2026-001" />
        </label>

        <label className="form-field">
          <span>School Year</span>
          <Select value={form.schoolYearId} onChange={handleChange('schoolYearId')}>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </Select>
        </label>

        <label className="form-field">
          <span>Strand</span>
          <Select value={form.strandId} onChange={handleChange('strandId')}>
            {strands.filter((strand) => strand.schoolYearId === form.schoolYearId).map((strand) => (
              <option key={strand.id} value={strand.id}>{strand.name}</option>
            ))}
          </Select>
        </label>

        <label className="form-field">
          <span>Section</span>
          <Select value={form.sectionId} onChange={handleChange('sectionId')}>
            <option value="">Select section</option>
            {availableSections.map((section) => (
              <option key={section.id} value={section.id}>{section.name || section.code || 'Unnamed section'}</option>
            ))}
          </Select>
        </label>

        <label className="form-field">
          <span>Status</span>
          <Select value={form.status} onChange={handleChange('status')}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </label>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
