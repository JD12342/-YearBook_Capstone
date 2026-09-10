import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase/firestore.js'

const studentsCollection = collection(db, 'students')
const schoolYearsCollection = collection(db, 'schoolYears')
const strandsCollection = collection(db, 'strands')
const photosCollection = collection(db, 'photos')
const yearbooksCollection = collection(db, 'yearbooks')

const countDocuments = async (source) => {
  const snapshot = await getCountFromServer(source)
  return snapshot.data().count
}

const aggregateByLabel = (entries) => Array.from(entries.reduce((totals, entry) => {
  const key = entry.label.trim().toLowerCase()
  const current = totals.get(key) || { label: entry.label, value: 0 }
  current.value += entry.value
  totals.set(key, current)
  return totals
}, new Map()).values()).filter((entry) => entry.value > 0)

export const getDashboardStats = async () => {
  try {
    const [yearsSnap, strandsSnap, totalStudents, archivedStudents, approvedPhotos, yearbooksSnap] = await Promise.all([
      getDocs(schoolYearsCollection),
      getDocs(strandsCollection),
      countDocuments(studentsCollection),
      countDocuments(query(studentsCollection, where('status', '==', 'archived'))),
      countDocuments(query(photosCollection, where('status', '==', 'approved'))),
      getDocs(yearbooksCollection),
    ])

    const schoolYears = yearsSnap.docs.map((document) => ({ id: document.id, ...document.data() }))
    const strands = strandsSnap.docs.map((document) => ({ id: document.id, ...document.data() }))

    const [yearCounts, strandCounts, studentsWithoutPhotos] = await Promise.all([
      Promise.all(schoolYears.map(async (schoolYear) => ({
        label: schoolYear.name || 'Unnamed school year',
        value: await countDocuments(query(studentsCollection, where('schoolYearId', '==', schoolYear.id))),
      }))),
      Promise.all(strands.map(async (strand) => ({
        label: strand.name || 'Unnamed strand',
        value: await countDocuments(query(studentsCollection, where('strandId', '==', strand.id))),
      }))),
      countDocuments(query(studentsCollection, where('photoId', '==', ''))),
    ])

    return {
      totalStudents,
      activeStudents: Math.max(totalStudents - archivedStudents, 0),
      archivedStudents,
      totalSchoolYears: schoolYears.length,
      totalStrands: new Set(strands.map((strand) => (strand.code || strand.name || '').trim().toLowerCase()).filter(Boolean)).size,
      totalPhotos: approvedPhotos,
      totalYearbooks: yearbooksSnap.docs.filter(book => schoolYears.some(year => year.id === book.data().schoolYearId)).length,
      studentsBySchoolYear: yearCounts.filter((entry) => entry.value > 0),
      studentsByStrand: aggregateByLabel(strandCounts),
      studentsWithoutPhotos,
    }
  } catch (error) {
    if (error?.code === 'permission-denied') {
      throw new Error('Firebase rejected the dashboard request. Publish the GradBook Firestore rules, then sign in again.')
    }
    throw new Error(error?.message || 'Unable to load dashboard statistics.')
  }
}
