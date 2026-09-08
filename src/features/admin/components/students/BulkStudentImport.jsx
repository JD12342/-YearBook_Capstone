import { useMemo, useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { BulkStudentPreview } from './BulkStudentPreview.jsx'
import { parseStudentCSV, validateStudentRows } from '../../utils/studentImport.js'

export function BulkStudentImport({
  schoolYears = [],
  strands = [],
  onClose,
  onImport,
  existingStudents = [],
}) {
  const [schoolYearId, setSchoolYearId] = useState(schoolYears[0]?.id ?? '')
  const [strandId, setStrandId] = useState(strands[0]?.id ?? '')
  const [sectionId, setSectionId] = useState('')
  const [importMode, setImportMode] = useState('paste')
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const availableStrands = useMemo(() =>
    strands.filter((strand) => strand.schoolYearId === schoolYearId),
    [schoolYearId, strands],
  )

  const availableSections = useMemo(() => {
    const selectedStrand = strands.find((strand) => strand.id === strandId)
    return selectedStrand?.sections ?? []
  }, [strandId, strands])

  const handleSchoolYearChange = (event) => {
    const nextSchoolYearId = event.target.value
    setSchoolYearId(nextSchoolYearId)
    const nextStrand = strands.find((strand) => strand.schoolYearId === nextSchoolYearId)
    setStrandId(nextStrand?.id ?? '')
    setSectionId('')
  }

  const handleStrandChange = (event) => {
    setStrandId(event.target.value)
    setSectionId('')
  }

  const handleParse = () => {
    if (!schoolYearId || !strandId || !sectionId) {
      setError('Please select a school year, strand, and section before importing.')
      return
    }

    let rows = []
    if (importMode === 'paste') {
      rows = parseStudentCSV(rawText)
    } else {
      const input = rawText || ''
      rows = parseStudentCSV(input)
    }

    const validated = validateStudentRows(rows, existingStudents.filter((student) => student.schoolYearId === schoolYearId))
    setPreview(validated.rows)
    setError(validated.validRows ? '' : 'Please fix invalid or duplicate rows before importing.')
  }

  const handleImport = async () => {
    if (!preview.length) return
    const validRows = preview.filter((row) => row.valid)
    if (!validRows.length) {
      setError('No valid students available to import.')
      return
    }

    setIsImporting(true)
    setError('')

    try {
      await onImport({
        schoolYearId,
        strandId,
        sectionId,
        rows: validRows,
      })
    } catch (importError) {
      setError(importError.message || 'Unable to import students.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="bulk-import-form">
      <div className="field-grid">
        <label className="form-field">
          <span>School Year</span>
          <Select value={schoolYearId} onChange={handleSchoolYearChange}>
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </Select>
        </label>

        <label className="form-field">
          <span>Strand</span>
          <Select value={strandId} onChange={handleStrandChange}>
            {availableStrands.map((strand) => (
              <option key={strand.id} value={strand.id}>{strand.name}</option>
            ))}
          </Select>
        </label>

        <label className="form-field span-2">
          <span>Section</span>
          <Select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">Select a section</option>
            {availableSections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </Select>
        </label>
      </div>

      <div className="bulk-mode-switch">
        <Button type="button" variant={importMode === 'paste' ? 'primary' : 'secondary'} size="sm" onClick={() => setImportMode('paste')}>Paste student list</Button>
        <Button type="button" variant={importMode === 'csv' ? 'primary' : 'secondary'} size="sm" onClick={() => setImportMode('csv')}>CSV upload</Button>
      </div>

      <label className="form-field">
        <span>Student data</span>
        <textarea
          className="field bulk-textarea"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={8}
          placeholder={importMode === 'paste'
            ? '2026-0001,Juan,,Dela Cruz,\n2026-0002,Maria,Anne,Santos,'
            : 'Paste CSV rows or upload a CSV file via the file input below.'}
        />
      </label>

      <div className="bulk-upload-row">
        <label className="upload-file-trigger">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (loadEvent) => setRawText(String(loadEvent.target?.result ?? ''))
              reader.readAsText(file)
            }}
          />
          Upload CSV
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={handleParse}>Preview Import</Button>
      </div>

      {preview.length > 0 && (
        <BulkStudentPreview rows={preview} onCancel={onClose} onConfirm={handleImport} importing={isImporting} />
      )}
    </div>
  )
}
