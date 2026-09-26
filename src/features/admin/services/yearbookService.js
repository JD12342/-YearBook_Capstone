import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase/firestore.js'
import { DEFAULT_YEARBOOK_THEME, createDefaultYearbookPages } from '../../yearbook/data/yearbookDefaults.js'

import { getApprovedPhotoForStudent } from './photoService.js'
import { buildStudentPages } from '../../yearbook/data/studentPages.js'

const yearbooksCollection = collection(db, 'yearbooks')

export const getYearbooks = async ({ schoolYearId } = {}) => {
  try {
    const [snapshot, yearsSnapshot] = await Promise.all([getDocs(yearbooksCollection), getDocs(collection(db, 'schoolYears'))])
    const years = new Map(yearsSnapshot.docs.map(record => [record.id, record.data()]))
    const records = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data()
        const year = years.get(data.schoolYearId)
        return { ...data, id: docSnap.id, schoolYearName: year?.name || '', schoolYearExists: Boolean(year) }
      })
      .sort((left, right) => (left.title ?? '').localeCompare(right.title ?? ''))

    if (!schoolYearId) return records
    return records.filter((yearbook) => yearbook.schoolYearId === schoolYearId)
  } catch (error) {
    throw new Error('Unable to load yearbooks.')
  }
}

export const getYearbookById = async (yearbookId) => {
  try {
    const snap = await getDoc(doc(db, 'yearbooks', yearbookId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (error) {
    throw new Error('Unable to load yearbook details.')
  }
}

export const createYearbook = async (payload) => {
  try {
    const existing = await getDocs(query(yearbooksCollection, where('schoolYearId', '==', payload.schoolYearId), limit(1)))
    if (!existing.empty) throw new Error('This school year already has a yearbook. Customize its existing edition.')
    const publication = await buildPublication(payload)

    const ref = doc(yearbooksCollection, payload.schoolYearId)
    await runTransaction(db, async transaction => {
      const yearRef = doc(db, 'schoolYears', payload.schoolYearId)
      const [year, book] = await Promise.all([transaction.get(yearRef), transaction.get(ref)])
      if (!year.exists()) throw new Error('Choose an existing school year.')
      if (book.exists() || year.data().yearbookId) throw new Error('This school year already has a yearbook.')
      transaction.set(ref, {
      ...DEFAULT_YEARBOOK_THEME,
      ...payload,
      title: payload.title?.trim(),
      status: payload.status || 'draft',
      coverTitle: payload.coverTitle || 'GRAD BOOK',
      coverSubtitle: payload.coverSubtitle || payload.schoolYearName || '',
      pages: payload.pages || createDefaultYearbookPages(payload.schoolYearName),
      ...publication,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      })
      transaction.update(yearRef, { yearbookId: ref.id })
    })
    return ref.id
  } catch (error) {
    throw new Error(error.message || 'Unable to create yearbook.')
  }
}

export const updateYearbook = async (yearbookId, updates) => {
  try {
    const ref = doc(db, 'yearbooks', yearbookId)
    const existing = await getDoc(ref)
    if (!existing.exists()) throw new Error('This yearbook no longer exists.')
    if (updates.schoolYearId && updates.schoolYearId !== existing.data().schoolYearId) throw new Error('A yearbook cannot be moved to another school year.')
    const payload = { ...existing.data(), ...updates }
    const publication = await buildPublication(payload)
    await runTransaction(db, async transaction => {
      const yearRef = doc(db, 'schoolYears', payload.schoolYearId)
      const [year, book] = await Promise.all([transaction.get(yearRef), transaction.get(ref)])
      if (!year.exists() || !book.exists()) throw new Error('The yearbook or its school year no longer exists. Refresh the studio.')
      if (year.data().yearbookId && year.data().yearbookId !== yearbookId) throw new Error('Another edition is already linked to this school year.')
      transaction.update(ref, { ...updates, ...publication, schoolYearName: year.data().name, updatedAt: serverTimestamp() })
      transaction.update(yearRef, { yearbookId })
    })
  } catch (error) {
    throw new Error(error.message || 'Unable to update yearbook.')
  }
}

// Readers use this stored snapshot because student records remain private.
// Any change to a student refreshes the matching edition automatically.
export const syncYearbookForSchoolYear = async (schoolYearId) => {
  if (!schoolYearId) return false
  const snapshot = await getDocs(query(yearbooksCollection, where('schoolYearId', '==', schoolYearId), limit(1)))
  if (snapshot.empty) return false
  const record = snapshot.docs[0]
  const publication = await buildPublication({ id: record.id, ...record.data() })
  await updateDoc(record.ref, { ...publication, updatedAt: serverTimestamp() })
  return true
}

export const archiveYearbook = async (yearbookId) => {
  try {
    await updateDoc(doc(db, 'yearbooks', yearbookId), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error('Unable to archive yearbook.')
  }
}

export const deleteYearbook = async (yearbookId) => {
  try {
    await runTransaction(db, async transaction => {
      const ref = doc(db, 'yearbooks', yearbookId)
      const book = await transaction.get(ref)
      if (!book.exists()) return
      const yearRef = doc(db, 'schoolYears', book.data().schoolYearId)
      const year = await transaction.get(yearRef)
      transaction.delete(ref)
      if (year.exists() && year.data().yearbookId === yearbookId) transaction.update(yearRef, { yearbookId: null })
    })
  } catch {
    throw new Error('Unable to delete yearbook.')
  }
}

async function buildPublication(payload) {
  if (!payload.schoolYearId) throw new Error('Choose an existing school year.')
  const year = await getDoc(doc(db, 'schoolYears', payload.schoolYearId))
  if (!year.exists()) throw new Error('This yearbook is linked to a school year that no longer exists.')
  const [students, strands, sections, teachers, teacherAssignments] = await Promise.all([
    ...['students', 'strands', 'sections'].map(name => getDocs(query(collection(db, name), where('schoolYearId', '==', payload.schoolYearId)))),
    getDocs(query(collection(db, 'users'), where('profileType', '==', 'Teacher'))),
    getDocs(collection(db, 'teacherAssignments')),
  ])
  // Printed yearbook profiles use the short codes students recognize (for example,
  // STEM and STEM-A), while the admin forms can still show their full descriptions.
  const labels = snapshot => new Map(snapshot.docs.map(record => {
    const data = record.data()
    return [record.id, data.code || data.name || '']
  }))
  const strandLabels = labels(strands), sectionLabels = labels(sections)
  const records = students.docs.map(record => ({ ...record.data(), id: record.id }))
    .filter(student => (student.status === 'active' || (payload.includeArchivedStudents === true && student.status === 'archived')) && student.firstName && student.lastName)
    .sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName))
  const profiles = []
  // Bound concurrent portrait reads for larger classes.
  for (let start = 0; start < records.length; start += 12) {
    profiles.push(...await Promise.all(records.slice(start, start + 12).map(async student => {
      // Community yearbooks contain only the final portrait approved by an admin.
      const photo = await getApprovedPhotoForStudent(student)
      return {
        id: student.id,
        name: [student.firstName, student.middleName, student.lastName, student.suffix].filter(Boolean).join(' '),
        strand: strandLabels.get(student.strandId) || '', section: sectionLabels.get(student.sectionId) || '',
        awards: String(student.awards || ''),
        photoUrl: photo?.studentId === student.id ? photo.imageUrl || '' : '',
      }
    })))
  }
  const sectionIds = new Set(sections.docs.map(record => record.id))
  const assignments = new Map(teacherAssignments.docs.map(record => [record.id, record.data()]))
  const teacherProfiles = teachers.docs.map(record => ({ id: record.id, ...record.data() }))
    .filter(teacher => teacher.status === 'active' && assignments.get(teacher.id)?.active === true)
    .map(teacher => {
      const assignedSections = (assignments.get(teacher.id)?.sectionIds || []).filter(id => sectionIds.has(id))
      if (!assignedSections.length) return null
      return {
        id: teacher.id,
        name: teacher.fullName || teacher.email || 'Teacher',
        strand: 'FACULTY',
        section: assignedSections.map(id => sectionLabels.get(id)).filter(Boolean).join(' · '),
        awards: teacher.position || 'Class Teacher',
        photoUrl: teacher.portraitUrl || '',
      }
    }).filter(Boolean).sort((left, right) => left.name.localeCompare(right.name))

  const sourcePages = (payload.pages || createDefaultYearbookPages(year.data().name)).filter(page => !String(page.id || '').startsWith('faculty'))
  const studentPages = buildStudentPages(sourcePages, profiles)
  const facultyPages = Array.from({ length: Math.ceil(teacherProfiles.length / 2) }, (_, index) => ({
    id: index ? `faculty-${index + 1}` : 'faculty',
    layout: 'profiles',
    eyebrow: 'THE FACULTY',
    title: 'The mentors behind the memories.',
    body: 'The teachers who guided each class, supported every milestone, and helped shape this graduating chapter.',
    quote: 'A lasting legacy begins with those who teach us how to grow.',
    profiles: teacherProfiles.slice(index * 2, index * 2 + 2),
  }))
  const campusIndex = studentPages.findIndex(page => page.id === 'campus')
  const pages = facultyPages.length
    ? [...studentPages.slice(0, campusIndex < 0 ? studentPages.length : campusIndex), ...facultyPages, ...studentPages.slice(campusIndex < 0 ? studentPages.length : campusIndex)]
    : studentPages
  if (new TextEncoder().encode(JSON.stringify({ ...payload, pages })).length > 900000) throw new Error('This edition is too large to save. Shorten the editorial text or reduce embedded artwork data.')
  return { pages, schoolYearName: year.data().name, recordsVersion: 1, studentCount: profiles.length, teacherCount: teacherProfiles.length, archivedStudentCount: students.docs.filter(record => record.data().status === 'archived').length, recordsSyncedAt: serverTimestamp() }
}
