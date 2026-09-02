const normalizeField = (value) => String(value ?? '').trim()

export function parseStudentCSV(text = '') {
  if (!text || !text.trim()) return []

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line
        .split(',')
        .map((cell) => cell.trim().replace(/^"|"$/g, ''))

      const [studentNumber = '', firstName = '', middleName = '', lastName = '', suffix = ''] = cells

      return {
        studentNumber: normalizeField(studentNumber),
        firstName: normalizeField(firstName),
        middleName: normalizeField(middleName),
        lastName: normalizeField(lastName),
        suffix: normalizeField(suffix),
      }
    })
}

export function detectDuplicates(rows = [], existingStudents = []) {
  const seen = new Set()
  const duplicateStudentNumbers = new Set()

  rows.forEach((row) => {
    const key = row.studentNumber?.toLowerCase()
    if (!key) return
    if (seen.has(key)) {
      duplicateStudentNumbers.add(row.studentNumber)
    }
    seen.add(key)
  })

  existingStudents.forEach((student) => {
    const key = student.studentNumber?.toLowerCase()
    if (!key) return
    seen.add(key)
  })

  return rows.map((row) => {
    const studentNumber = row.studentNumber?.trim()
    const duplicateInImport = !!studentNumber && duplicateStudentNumbers.has(studentNumber)
    const duplicateInFirestore = !!studentNumber && existingStudents.some((student) => student.studentNumber?.toLowerCase() === studentNumber.toLowerCase())

    return {
      ...row,
      duplicate: duplicateInImport || duplicateInFirestore,
      duplicateMessage: duplicateInImport ? `Duplicate student number: ${studentNumber}` : duplicateInFirestore ? `Duplicate student number: ${studentNumber}` : '',
    }
  })
}

export function validateStudentRows(rows = [], existingStudents = []) {
  const normalized = detectDuplicates(rows, existingStudents).map((row, index) => {
    const required = [row.studentNumber, row.firstName, row.lastName]
    const hasRequiredData = required.every((value) => normalizeField(value).length > 0)

    const nextRow = {
      ...row,
      index: index + 1,
      valid: hasRequiredData && !row.duplicate,
      validation: hasRequiredData ? (row.duplicate ? 'Duplicate' : 'Ready') : 'Missing required fields',
    }

    if (!hasRequiredData) {
      nextRow.validation = 'Missing required fields'
    }

    return nextRow
  })

  const totalRows = normalized.length
  const validRows = normalized.filter((row) => row.valid).length
  const invalidRows = totalRows - validRows
  const duplicateRows = normalized.filter((row) => row.validation === 'Duplicate').length

  return {
    rows: normalized,
    totalRows,
    validRows,
    invalidRows,
    duplicateRows,
  }
}

export function prepareStudentRecords(rows = [], schoolYearId, strandId, sectionId) {
  return rows
    .filter((row) => row.valid)
    .map((row) => ({
      firstName: normalizeField(row.firstName),
      middleName: normalizeField(row.middleName),
      lastName: normalizeField(row.lastName),
      suffix: normalizeField(row.suffix),
      studentNumber: normalizeField(row.studentNumber),
      schoolYearId,
      strandId,
      sectionId,
      status: 'active',
      photoId: '',
    }))
}
