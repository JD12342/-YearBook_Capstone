import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { deleteObject, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import { db, firebaseApp, storage } from '../../../app/firebaseClient.js'
import { optimizePortraitForUpload } from '../../admin/services/imageOptimizationService.js'

const functions = getFunctions(firebaseApp, 'asia-southeast1')
const callable = (name) => httpsCallable(functions, name)
const assignmentCache = new Map()
const memoryCache = new Map()
const sectionCache = new Map()
let teacherCache = null

export async function getTeacherAssignment(uid) {
  if (!uid) return null
  if (assignmentCache.has(uid)) return assignmentCache.get(uid)
  const snapshot = await getDoc(doc(db, 'teacherAssignments', uid))
  const assignment = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  assignmentCache.set(uid, assignment)
  return assignment
}

export function subscribeTeacherAssignment(uid, onValue, onError) {
  if (!uid) return () => {}
  if (assignmentCache.has(uid)) onValue(assignmentCache.get(uid))
  return onSnapshot(doc(db, 'teacherAssignments', uid), (snapshot) => {
    const assignment = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
    assignmentCache.set(uid, assignment)
    onValue(assignment)
  }, onError)
}

export function subscribeTeacherMemories(uid, onValue, onError) {
  if (!uid) return () => {}
  if (memoryCache.has(uid)) onValue(memoryCache.get(uid))
  return onSnapshot(query(collection(db, 'memories'), where('ownerUid', '==', uid)), (snapshot) => {
    const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      .sort((left, right) => Number(right.createdAt?.seconds || 0) - Number(left.createdAt?.seconds || 0))
    memoryCache.set(uid, records)
    onValue(records)
  }, onError)
}

export async function loadAssignmentSections(sectionIds = []) {
  const missingIds = sectionIds.filter((id) => !sectionCache.has(id))
  const snapshots = await Promise.all(missingIds.map((id) => getDoc(doc(db, 'sections', id))))
  snapshots.forEach((snapshot) => {
    sectionCache.set(snapshot.id, snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
  })
  return sectionIds.map((id) => sectionCache.get(id)).filter(Boolean)
}

export const readVideoDurationSeconds = (file) => new Promise((resolve, reject) => {
  if (!file?.type?.startsWith('video/')) { resolve(0); return }
  const video = document.createElement('video')
  const url = URL.createObjectURL(file)
  const cleanup = () => { URL.revokeObjectURL(url); video.removeAttribute('src'); video.load() }
  video.preload = 'metadata'
  video.onloadedmetadata = () => {
    const duration = Number(video.duration)
    cleanup()
    if (!Number.isFinite(duration) || duration <= 0) reject(new Error(`GradBook could not read the duration of ${file.name}.`))
    else resolve(duration)
  }
  video.onerror = () => { cleanup(); reject(new Error(`GradBook could not read the duration of ${file.name}.`)) }
  video.src = url
})

const uploadOne = (uid, memoryId, file, index, durationSeconds, onProgress) => new Promise((resolve, reject) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `teacher-content/${uid}/${memoryId}/${Date.now()}-${index}-${safeName}`
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type })
  task.on('state_changed', (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes), reject, async () => {
    resolve({ path, url: await getDownloadURL(task.snapshot.ref), type: file.type.startsWith('video/') ? 'video' : 'image', mimeType: file.type, fileName: file.name, ...(durationSeconds ? { durationSeconds: Math.ceil(durationSeconds) } : {}) })
  })
})

export async function submitTeacherMemory({ uid, contributorName, title, caption, sectionId, files, videoDurationLimitSeconds = 120, onProgress }) {
  files.forEach((file) => {
    const maxBytes = (file.type.startsWith('video/') ? 80 : 10) * 1024 * 1024
    if (file.size > maxBytes) throw new Error(`${file.name} is too large. Photos can be 10 MB and videos 80 MB.`)
  })
  const fileEntries = await Promise.all(files.map(async (file) => ({ file, durationSeconds: file.type.startsWith('video/') ? await readVideoDurationSeconds(file) : 0 })))
  const durationLimit = Math.max(Number(videoDurationLimitSeconds) || 120, 1)
  const tooLong = fileEntries.find((entry) => entry.durationSeconds > durationLimit)
  if (tooLong) throw new Error(`${tooLong.file.name} exceeds the ${Math.ceil(durationLimit / 60)}-minute video limit.`)
  const photos = fileEntries.filter((entry) => entry.file.type.startsWith('image/')).length
  const videoEntries = fileEntries.filter((entry) => entry.file.type.startsWith('video/'))
  const videos = videoEntries.length
  const reservation = await callable('reserveTeacherMemory')({ title, caption, sectionId, contributorName, photoCount: photos, videoCount: videos, videoDurationsSeconds: videoEntries.map((entry) => Math.ceil(entry.durationSeconds)) })
  const memoryId = reservation.data.id
  const uploaded = []
  try {
    for (let index = 0; index < fileEntries.length; index += 1) {
      const entry = fileEntries[index]
      uploaded.push(await uploadOne(uid, memoryId, entry.file, index, entry.durationSeconds, (part) => onProgress?.((index + part) / fileEntries.length)))
    }
    await updateDoc(doc(db, 'memories', memoryId), { media: uploaded, images: uploaded.filter((item) => item.type === 'image'), updatedAt: serverTimestamp() })
    return memoryId
  } catch (error) {
    await Promise.all(uploaded.map((item) => deleteObject(ref(storage, item.path)).catch(() => {})))
    await callable('cancelTeacherMemoryReservation')({ memoryId }).catch(() => {})
    throw error
  }
}

export async function manageTeacher(payload) {
  const result = await callable('manageTeacherAccess')(payload)
  return result.data
}

export async function getTeachers() {
  if (teacherCache) return teacherCache
  const snapshot = await getDocs(query(collection(db, 'users'), where('profileType', '==', 'Teacher')))
  teacherCache = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  return teacherCache
}

export async function uploadTeacherPortrait({ uid, file }) {
  if (!uid || !file?.type?.startsWith('image/')) throw new Error('Choose a valid teacher portrait.')
  const optimized = await optimizePortraitForUpload(file)
  const path = `teacher-portraits/${uid}/approved/${Date.now()}.jpg`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, optimized.file, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(fileRef)
  await updateDoc(doc(db, 'users', uid), { portraitUrl: url, portraitPath: path, portraitApprovedAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { path, url }
}
