import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase/firestore.js'

const studentsCollection = collection(db, 'students')
const schoolYearsCollection = collection(db, 'schoolYears')
const strandsCollection = collection(db, 'strands')
const photosCollection = collection(db, 'photos')
const yearbooksCollection = collection(db, 'yearbooks')

export const getDashboardStats = async () => {
  const [studentsSnap, yearsSnap, strandsSnap, photosSnap, yearbooksSnap] = await Promise.all([
    getDocs(query(studentsCollection)),
    getDocs(query(schoolYearsCollection)),
    getDocs(query(strandsCollection)),
    getDocs(query(photosCollection)),
    getDocs(query(yearbooksCollection)),
  ])

  const students = studentsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  const schoolYears = yearsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  const strands = strandsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  const photos = photosSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  const yearbooks = yearbooksSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

  return {
    totalStudents: students.length,
    activeStudents: students.filter((student) => student.status !== 'archived').length,
    archivedStudents: students.filter((student) => student.status === 'archived').length,
    totalSchoolYears: schoolYears.length,
    totalStrands: strands.length,
    totalPhotos: photos.length,
    totalYearbooks: yearbooks.length,
    studentsBySchoolYear: schoolYears
      .map((schoolYear) => ({
        label: schoolYear.name || 'Unnamed school year',
        value: students.filter((student) => student.schoolYearId === schoolYear.id).length,
      }))
      .filter((entry) => entry.value > 0),
    studentsByStrand: strands
      .map((strand) => ({
        label: strand.name || 'Unnamed strand',
        value: students.filter((student) => student.strandId === strand.id).length,
      }))
      .filter((entry) => entry.value > 0),
    studentsWithoutPhotos: students.filter((student) => !student.photoId).length,
  }
}
