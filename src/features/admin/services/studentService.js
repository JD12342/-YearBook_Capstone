import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase/firestore.js'

const studentsCollection = collection(db, 'students')

const normalizeRecord = (student = {}) => ({
  firstName: String(student.firstName ?? '').trim(),
  middleName: String(student.middleName ?? '').trim(),
  lastName: String(student.lastName ?? '').trim(),
  suffix: String(student.suffix ?? '').trim(),
  studentNumber: String(student.studentNumber ?? '').trim(),
  schoolYearId: String(student.schoolYearId ?? '').trim(),
  strandId: String(student.strandId ?? '').trim(),
  sectionId: String(student.sectionId ?? '').trim(),
  lrn: String(student.lrn ?? '').trim(),
  email: String(student.email ?? '').trim(),
  credentials: String(student.credentials ?? '').trim(),
  awards: String(student.awards ?? '').trim(),
  status: student.status || 'active',
  photoId: String(student.photoId ?? '').trim(),
})

export const getStudents = async ({ schoolYearId, strandId, sectionId, status, search } = {}) => {
  try {
    const constraints = []
    if (schoolYearId) constraints.push(where('schoolYearId', '==', schoolYearId))
    if (strandId) constraints.push(where('strandId', '==', strandId))
    if (sectionId) constraints.push(where('sectionId', '==', sectionId))
    if (status) constraints.push(where('status', '==', status))

    // Bound accidental all-school reads. Normal admin use narrows this further
    // by school year, strand, and section.
    constraints.push(limit(500))

    const snapshot = await getDocs(query(studentsCollection, ...constraints))
    const records = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    const filtered = records.filter((student) => {
      const matchesSchoolYear = !schoolYearId || student.schoolYearId === schoolYearId
      const matchesStrand = !strandId || student.strandId === strandId
      const matchesSection = !sectionId || student.sectionId === sectionId
      const matchesStatus = !status || student.status === status

      if (!matchesSchoolYear || !matchesStrand || !matchesSection || !matchesStatus) {
        return false
      }

      if (!search) return true

      const query = search.toLowerCase()
      const haystack = [
        student.firstName,
        student.middleName,
        student.lastName,
        student.studentNumber,
        `${student.firstName ?? ''} ${student.middleName ?? ''} ${student.lastName ?? ''}`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })

    return filtered.sort((left, right) => {
      const leftName = `${left.lastName ?? ''} ${left.firstName ?? ''}`.trim().toLowerCase()
      const rightName = `${right.lastName ?? ''} ${right.firstName ?? ''}`.trim().toLowerCase()
      return leftName.localeCompare(rightName)
    })
  } catch (error) {
    console.error('getStudents error:', error)
    throw new Error('Unable to load students from Firebase.')
  }
}

export const getStudentById = async (studentId) => {
  try {
    const studentSnap = await getDoc(doc(db, 'students', studentId))
    return studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null
  } catch (error) {
    console.error('getStudentById error:', error)
    throw new Error('Unable to load the selected student.')
  }
}

export const getStudentsBySection = async (sectionId) => getStudents({ sectionId })
export const getStudentsBySchoolYear = async (schoolYearId) => getStudents({ schoolYearId })
export const getStudentsByStrand = async (strandId) => getStudents({ strandId })
export const searchStudents = async (searchTerm = '') => getStudents({ search: searchTerm })

export const createStudent = async (studentData) => {
  try {
    const payload = normalizeRecord(studentData)
    if (!payload.firstName || !payload.lastName || !payload.studentNumber || !payload.schoolYearId || !payload.strandId || !payload.sectionId) {
      throw new Error('Please complete all required student fields.')
    }

    const duplicateCheck = await getDocs(query(
      studentsCollection,
      where('schoolYearId', '==', payload.schoolYearId),
      where('studentNumber', '==', payload.studentNumber),
      limit(1),
    ))
    const hasDuplicate = !duplicateCheck.empty

    if (hasDuplicate) {
      throw new Error(`Duplicate student number: ${payload.studentNumber}`)
    }

    const ref = await addDoc(studentsCollection, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return ref.id
  } catch (error) {
    console.error('createStudent error:', error)
    throw new Error(error.message || 'Unable to create student record.')
  }
}

export const updateStudent = async (studentId, updates) => {
  try {
    const payload = normalizeRecord({ ...updates })
    await updateDoc(doc(db, 'students', studentId), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('updateStudent error:', error)
    throw new Error(error.message || 'Unable to update student record.')
  }
}

export const deleteStudent = async (studentId) => {
  try {
    await deleteDoc(doc(db, 'students', studentId))
  } catch (error) {
    console.error('deleteStudent error:', error)
    throw new Error('Unable to permanently delete this student.')
  }
}

export const archiveStudent = async (studentId) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('archiveStudent error:', error)
    throw new Error('Unable to archive this student.')
  }
}

export const restoreStudent = async (studentId) => {
  try {
    await updateDoc(doc(db, 'students', studentId), {
      status: 'active',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('restoreStudent error:', error)
    throw new Error('Unable to restore this student.')
  }
}

export const bulkCreateStudents = async (studentRecords = []) => {
  if (!studentRecords.length) return 0

  const batchSize = 400
  for (let start = 0; start < studentRecords.length; start += batchSize) {
    const batch = writeBatch(db)
    studentRecords.slice(start, start + batchSize).forEach((student) => {
      const ref = doc(studentsCollection)
      batch.set(ref, {
        ...normalizeRecord(student),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }
  return studentRecords.length
}

export const buildDisplayName = ({ firstName = '', middleName = '', lastName = '', suffix = '' }) => {
  const normalizedMiddle = middleName ? `${middleName.charAt(0)}.` : ''
  const suffixText = suffix ? ` ${suffix}` : ''
  return [firstName, normalizedMiddle, lastName, suffixText].filter(Boolean).join(' ').trim()
}
