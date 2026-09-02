import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
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
  status: student.status || 'active',
  photoId: String(student.photoId ?? '').trim(),
})

export const getStudents = async ({ schoolYearId, strandId, sectionId, status, search } = {}) => {
  try {
    const snapshot = await getDocs(studentsCollection)
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

    const duplicateCheck = await getDocs(studentsCollection)
    const hasDuplicate = duplicateCheck.docs.some((docSnap) => {
      const current = docSnap.data()
      return current.schoolYearId === payload.schoolYearId && current.studentNumber?.toLowerCase() === payload.studentNumber.toLowerCase()
    })

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

  const batch = writeBatch(db)
  studentRecords.forEach((student) => {
    const ref = doc(studentsCollection)
    batch.set(ref, {
      ...normalizeRecord(student),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
  return studentRecords.length
}

export const buildDisplayName = ({ firstName = '', middleName = '', lastName = '', suffix = '' }) => {
  const normalizedMiddle = middleName ? `${middleName.charAt(0)}.` : ''
  const suffixText = suffix ? ` ${suffix}` : ''
  return [firstName, normalizedMiddle, lastName, suffixText].filter(Boolean).join(' ').trim()
}
