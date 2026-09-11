import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase/firestore.js'
import { isFirebaseConfigured } from './firebase/firebaseConfig.js'

const reportCollections = [
  'students',
  'photos',
  'schoolYears',
  'strands',
  'sections',
  'yearbooks',
  'accountRequests',
  'announcements',
  'schoolContent',
  'alumni',
]

const timestamp = (record) => Number(record?.updatedAt?.seconds ?? record?.createdAt?.seconds ?? 0)
const labelFor = (record, fallback) => record?.code || record?.name || fallback
const normalizePhotoStatus = (status) => {
  const value = String(status || 'captured').toLowerCase().replace(/[\s_-]+/g, '')
  if (value === 'approved') return 'approved'
  if (value === 'editing' || value === 'edited') return 'editing'
  if (value === 'retake' || value === 'retakeneeded' || value === 'rejected') return 'retake'
  return 'captured'
}

const percent = (value, total) => total ? Math.round((value / total) * 100) : 0

export const buildReport = (data, filters = {}) => {
  const schoolYears = data.schoolYears || []
  const strands = data.strands || []
  const sections = data.sections || []
  const schoolYearMap = new Map(schoolYears.map((record) => [record.id, labelFor(record, 'Unnamed school year')]))
  const strandMap = new Map(strands.map((record) => [record.id, labelFor(record, 'Unassigned strand')]))
  const sectionMap = new Map(sections.map((record) => [record.id, labelFor(record, 'Unassigned section')]))

  const students = (data.students || []).filter((student) => {
    if (filters.schoolYearId && student.schoolYearId !== filters.schoolYearId) return false
    if (filters.strandId && student.strandId !== filters.strandId) return false
    if (filters.sectionId && student.sectionId !== filters.sectionId) return false
    return true
  })
  const studentIds = new Set(students.map((student) => student.id))
  const latestPhotos = new Map()
  ;(data.photos || []).forEach((photo) => {
    if (!studentIds.has(photo.studentId)) return
    const current = latestPhotos.get(photo.studentId)
    if (!current || timestamp(photo) >= timestamp(current)) latestPhotos.set(photo.studentId, photo)
  })

  const photoCounts = { approved: 0, captured: 0, editing: 0, retake: 0, missing: 0 }
  students.forEach((student) => {
    const photo = latestPhotos.get(student.id)
    if (!photo) photoCounts.missing += 1
    else photoCounts[normalizePhotoStatus(photo.status)] += 1
  })

  const buildCoverage = (field, labels, fallback) => {
    const groups = new Map()
    students.forEach((student) => {
      const id = student[field] || ''
      const key = id || fallback
      const current = groups.get(key) || { id, label: labels.get(id) || fallback, students: 0, approved: 0 }
      current.students += 1
      if (normalizePhotoStatus(latestPhotos.get(student.id)?.status) === 'approved') current.approved += 1
      groups.set(key, current)
    })
    return [...groups.values()]
      .map((group) => ({ ...group, completion: percent(group.approved, group.students) }))
      .sort((left, right) => left.label.localeCompare(right.label))
  }

  const studentRows = students.map((student) => ({
    id: student.id,
    studentNumber: student.studentNumber || '',
    name: [student.firstName, student.middleName, student.lastName, student.suffix].filter(Boolean).join(' ') || student.name || 'Unnamed student',
    schoolYear: schoolYearMap.get(student.schoolYearId) || 'Unassigned',
    strand: strandMap.get(student.strandId) || 'Unassigned',
    section: sectionMap.get(student.sectionId) || 'Unassigned',
    studentStatus: student.status || 'active',
    photoStatus: latestPhotos.has(student.id) ? normalizePhotoStatus(latestPhotos.get(student.id).status) : 'missing',
  })).sort((left, right) => left.name.localeCompare(right.name))

  const yearbooks = (data.yearbooks || []).filter((yearbook) => !filters.schoolYearId || yearbook.schoolYearId === filters.schoolYearId)
  const activeStudents = students.filter((student) => student.status !== 'archived').length
  const approvedStudents = photoCounts.approved

  return {
    totals: {
      students: students.length,
      activeStudents,
      archivedStudents: students.length - activeStudents,
      approvedPortraits: approvedStudents,
      portraitCompletion: percent(approvedStudents, students.length),
      yearbooks: yearbooks.length,
      publishedYearbooks: yearbooks.filter((record) => record.status === 'active').length,
      pendingVerification: (data.accountRequests || []).filter((record) => (record.status || 'pending') === 'pending').length,
      publishedContent: [...(data.announcements || []), ...(data.schoolContent || [])].filter((record) => record.status === 'published').length,
      activeAlumni: (data.alumni || []).filter((record) => (record.status || 'active') === 'active').length,
    },
    photoCounts,
    strandCoverage: buildCoverage('strandId', strandMap, 'Unassigned strand'),
    sectionCoverage: buildCoverage('sectionId', sectionMap, 'Unassigned section'),
    studentRows,
  }
}

export const subscribeReportData = (onData, onError) => {
  if (!isFirebaseConfigured) {
    onError?.(new Error('Firebase is not configured. Add the admin Firebase values before opening reports.'))
    return () => {}
  }

  const data = {}
  const ready = new Set()
  let stopped = false
  const unsubscribe = reportCollections.map((collectionName) => onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      data[collectionName] = snapshot.docs.map((record) => ({ id: record.id, ...record.data() }))
      ready.add(collectionName)
      if (!stopped && ready.size === reportCollections.length) onData({ ...data })
    },
    (error) => {
      if (stopped) return
      if (error?.code === 'permission-denied') onError?.(new Error('Firebase denied access to report data. Publish the current Firestore rules, then sign in again.'))
      else onError?.(new Error(error?.message || 'Unable to synchronize report data.'))
    },
  ))

  return () => {
    stopped = true
    unsubscribe.forEach((stop) => stop())
  }
}
