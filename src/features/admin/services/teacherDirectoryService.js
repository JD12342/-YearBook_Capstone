import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db } from './firebase/firestore.js'
import { storage } from './firebase/storage.js'
import { optimizePortraitForUpload } from './imageOptimizationService.js'
import { syncYearbookForSchoolYear } from './yearbookService.js'

const teachersCollection = collection(db, 'teachers')
const clean = (value) => String(value || '').trim()
const clampLimit = (value, fallback, maximum) => Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), maximum)
const normalizeTeacher = (teacher = {}) => ({
  firstName: clean(teacher.firstName),
  middleName: clean(teacher.middleName),
  lastName: clean(teacher.lastName),
  suffix: clean(teacher.suffix),
  teacherNumber: clean(teacher.teacherNumber),
  position: clean(teacher.position),
  schoolYearId: clean(teacher.schoolYearId),
  sectionIds: [...new Set((teacher.sectionIds || []).map(clean).filter(Boolean))],
  status: teacher.status === 'archived' ? 'archived' : 'active',
})

export const teacherDisplayName = (teacher) => {
  const record = teacher || {}
  return [record.firstName, record.middleName, record.lastName, record.suffix].filter(Boolean).join(' ').trim()
}

export async function getTeacherAccounts() {
  const [usersSnapshot, assignmentsSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('profileType', '==', 'Teacher'), limit(500))),
    getDocs(query(collection(db, 'teacherAssignments'), limit(500))),
  ])
  const assignments = new Map(assignmentsSnapshot.docs.map((entry) => [entry.id, entry.data()]))
  return usersSnapshot.docs.map((entry) => {
    const profile = entry.data()
    const assignment = assignments.get(entry.id) || {}
    const usesLegacyDefaults = Number(assignment.photoLimit) === 40 && Number(assignment.videoLimit) === 5
    return {
      ...assignment,
      id: entry.id,
      uid: entry.id,
      fullName: profile.fullName || '',
      email: profile.email || '',
      teacherNumber: profile.referenceId || '',
      role: profile.role || 'Teacher',
      position: assignment.position || profile.position || 'Teacher',
      accountStatus: profile.status || 'disabled',
      sectionIds: assignment.sectionIds || [],
      schoolYearId: assignment.schoolYearId || '',
      photoLimit: usesLegacyDefaults ? 5 : assignment.photoLimit || 5,
      videoLimit: usesLegacyDefaults ? 2 : assignment.videoLimit || 2,
      videoDurationLimitSeconds: assignment.videoDurationLimitSeconds || 120,
    }
  }).sort((left, right) => (left.fullName || '').localeCompare(right.fullName || ''))
}

export async function updateTeacherAccountAssignment(teacher) {
  if (!teacher?.uid) throw new Error('Choose an approved teacher account.')
  const uid = clean(teacher.uid)
  const active = teacher.accountStatus === 'active'
  const sectionIds = [...new Set((teacher.sectionIds || []).map(clean).filter(Boolean))]
  const schoolYearId = clean(teacher.schoolYearId)

  try {
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', uid), {
      role: 'Teacher',
      status: active ? 'active' : 'disabled',
      updatedAt: serverTimestamp(),
    }, { merge: true })
    batch.set(doc(db, 'teacherAssignments', uid), {
      teacherUid: uid,
      active,
      sectionIds,
      schoolYearId,
      position: clean(teacher.position) || 'Teacher',
      photoLimit: clampLimit(teacher.photoLimit, 5, 500),
      videoLimit: clampLimit(teacher.videoLimit, 2, 100),
      videoDurationLimitSeconds: clampLimit(teacher.videoDurationLimitSeconds, 120, 3600),
      pendingPostLimit: 10,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    await batch.commit()
    return { uid, active, sectionIds }
  } catch (error) {
    if (error?.code === 'permission-denied') throw new Error('Only an administrator can assign teacher sections.')
    if (error?.code === 'unauthenticated') throw new Error('Your administrator session expired. Sign in again and retry.')
    throw new Error('The teacher assignment could not be saved. Please retry.')
  }
}

export async function getTeachers({ schoolYearId, status, search } = {}) {
  const snapshot = await getDocs(query(teachersCollection, limit(500)))
  const term = clean(search).toLowerCase()
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .filter((teacher) => (!schoolYearId || teacher.schoolYearId === schoolYearId) && (!status || teacher.status === status))
    .filter((teacher) => !term || [teacherDisplayName(teacher), teacher.teacherNumber, teacher.position].join(' ').toLowerCase().includes(term))
    .sort((left, right) => `${left.lastName || ''} ${left.firstName || ''}`.localeCompare(`${right.lastName || ''} ${right.firstName || ''}`))
}

export async function getTeacherById(teacherId) {
  if (!teacherId) return null
  const snapshot = await getDoc(doc(db, 'teachers', teacherId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function createTeacher(teacher) {
  const payload = normalizeTeacher(teacher)
  if (!payload.firstName || !payload.lastName || !payload.schoolYearId) throw new Error('First name, last name, and school year are required.')
  const existing = await getTeachers({ schoolYearId: payload.schoolYearId })
  if (payload.teacherNumber && existing.some((record) => clean(record.teacherNumber).toLowerCase() === payload.teacherNumber.toLowerCase())) throw new Error(`Teacher ID ${payload.teacherNumber} already exists for this school year.`)
  const created = await addDoc(teachersCollection, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await syncYearbookForSchoolYear(payload.schoolYearId)
  return created.id
}

export async function updateTeacher(teacherId, teacher) {
  const payload = normalizeTeacher(teacher)
  if (!payload.firstName || !payload.lastName || !payload.schoolYearId) throw new Error('First name, last name, and school year are required.')
  const previous = await getTeacherById(teacherId)
  await updateDoc(doc(db, 'teachers', teacherId), { ...payload, updatedAt: serverTimestamp() })
  await Promise.all([...new Set([previous?.schoolYearId, payload.schoolYearId].filter(Boolean))].map(syncYearbookForSchoolYear))
}

export async function setTeacherStatus(teacherId, status) {
  const teacher = await getTeacherById(teacherId)
  if (!teacher) throw new Error('The selected teacher no longer exists.')
  await updateDoc(doc(db, 'teachers', teacherId), { status: status === 'archived' ? 'archived' : 'active', updatedAt: serverTimestamp() })
  await syncYearbookForSchoolYear(teacher.schoolYearId)
}

export async function deleteTeacher(teacherId) {
  const teacher = await getTeacherById(teacherId)
  if (!teacher) return
  await deleteDoc(doc(db, 'teachers', teacherId))
  if (teacher.portraitPath) await deleteObject(ref(storage, teacher.portraitPath)).catch(() => {})
  await syncYearbookForSchoolYear(teacher.schoolYearId)
}

export async function uploadTeacherPortrait({ teacherId, file }) {
  if (!teacherId || !file?.type?.startsWith('image/')) throw new Error('Choose a valid teacher portrait.')
  const teacher = await getTeacherById(teacherId)
  if (!teacher) throw new Error('The selected teacher no longer exists.')
  const optimized = await optimizePortraitForUpload(file)
  const path = `teacher-portraits/${teacherId}/approved/${Date.now()}.jpg`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, optimized.file, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'teachers', teacherId), { portraitUrl: url, portraitPath: path, portraitApprovedAt: serverTimestamp(), updatedAt: serverTimestamp() })
  if (teacher.portraitPath) await deleteObject(ref(storage, teacher.portraitPath)).catch(() => {})
  await syncYearbookForSchoolYear(teacher.schoolYearId)
  return { path, url }
}
